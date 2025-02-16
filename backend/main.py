from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI()

# Configuração do CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Pode restringir a um domínio específico, se necessário
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos os headers
)

# Modelo de dados esperado na requisição
class AlgoritmoGeneticoInput(BaseModel):
    pesos: list[int]
    valores: list[int]
    capacidade: int
    tamanho_populacao: int
    num_geracoes: int
    taxa_mutacao: float

# Função para criar um indivíduo aleatório
def criar_individuo(n):
    return [random.randint(0, 1) for _ in range(n)]

# Função para calcular a fitness de um indivíduo
def calcular_nota(individuo, pesos, valores, capacidade):
    peso_total = sum(pesos[i] for i in range(len(pesos)) if individuo[i] == 1)
    valor_total = sum(valores[i] for i in range(len(valores)) if individuo[i] == 1)
    return valor_total if peso_total <= capacidade else 0

# Função para seleção dos pais
def selecionar_pais(populacao, pesos, valores, capacidade):
    return sorted(populacao, key=lambda ind: calcular_nota(ind, pesos, valores, capacidade), reverse=True)[:len(populacao) // 2]

# Função de crossover
def crossover(pai1, pai2):
    ponto_corte = random.randint(1, len(pai1) - 1)
    return pai1[:ponto_corte] + pai2[ponto_corte:], pai2[:ponto_corte] + pai1[ponto_corte:]

# Função de mutação
def mutar(individuo, taxa_mutacao):
    return [1 - gene if random.random() < taxa_mutacao else gene for gene in individuo]

@app.get("/")
def read_root():
    return {"message": "API do Algoritmo Genético da Mochila - FastAPI"}

@app.post("/executar_algoritmo")
def executar_algoritmo(input_data: AlgoritmoGeneticoInput):
    # Validando os dados de entrada
    if len(input_data.pesos) != len(input_data.valores):
        raise HTTPException(status_code=400, detail="Os arrays 'pesos' e 'valores' devem ter o mesmo tamanho.")

    n = len(input_data.pesos)  # Número de itens
    populacao = [criar_individuo(n) for _ in range(input_data.tamanho_populacao)]
    historico = []

    for geracao in range(input_data.num_geracoes):
        pais = selecionar_pais(populacao, input_data.pesos, input_data.valores, input_data.capacidade)
        nova_geracao = []

        while len(nova_geracao) < input_data.tamanho_populacao:
            pai1, pai2 = random.sample(pais, 2)
            filho1, filho2 = crossover(pai1, pai2)
            nova_geracao.append(mutar(filho1, input_data.taxa_mutacao))
            nova_geracao.append(mutar(filho2, input_data.taxa_mutacao))

        populacao = nova_geracao
        melhor_individuo = max(populacao, key=lambda ind: calcular_nota(ind, input_data.pesos, input_data.valores, input_data.capacidade))
        melhor_nota = calcular_nota(melhor_individuo, input_data.pesos, input_data.valores, input_data.capacidade)

        historico.append({"geracao": geracao + 1, "melhor_valor": melhor_nota})

    melhor_individuo = max(populacao, key=lambda ind: calcular_nota(ind, input_data.pesos, input_data.valores, input_data.capacidade))
    melhor_nota = calcular_nota(melhor_individuo, input_data.pesos, input_data.valores, input_data.capacidade)
    melhor_peso = sum(input_data.pesos[i] for i in range(n) if melhor_individuo[i] == 1)

    return {
        "historico": historico,
        "melhor_solucao": melhor_individuo,
        "melhor_valor": melhor_nota,
        "melhor_peso": melhor_peso
    }

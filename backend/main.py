import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import random

app = FastAPI()

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://didactic-garbanzo-q4g497wgwj9299rw-3000.app.github.dev/"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Modelo de entrada
class AlgoritmoGeneticoInput(BaseModel):
    pesos: list[int]
    valores: list[int]
    capacidade: int
    tamanho_populacao: int = Field(gt=1)
    num_geracoes: int = Field(gt=0)
    taxa_mutacao: float = Field(ge=0, le=1)

# Criar um indivíduo aleatório
def criar_individuo(n):
    return [random.randint(0, 1) for _ in range(n)]

# Calcular aptidão
def calcular_nota(individuo, pesos, valores, capacidade):
    peso_total = sum(pesos[i] for i in range(len(pesos)) if individuo[i] == 1)
    valor_total = sum(valores[i] for i in range(len(valores)) if individuo[i] == 1)
    return valor_total if peso_total <= capacidade else 0

# Selecionar pais com melhor aptidão
def selecionar_pais(populacao, pesos, valores, capacidade):
    return sorted(populacao, key=lambda ind: calcular_nota(ind, pesos, valores, capacidade), reverse=True)[:max(2, len(populacao) // 2)]

# Crossover
def crossover(pai1, pai2):
    if len(pai1) < 2:
        return pai1, pai2
    ponto_corte = random.randint(1, len(pai1) - 1)
    return pai1[:ponto_corte] + pai2[ponto_corte:], pai2[:ponto_corte] + pai1[ponto_corte:]

# Mutação
def mutar(individuo, taxa_mutacao):
    return [1 - gene if random.random() < taxa_mutacao else gene for gene in individuo]

# Endpoint raiz
@app.get("/")
def read_root():
    return {"message": "API do Algoritmo Genético está rodando! 🚀"}

# Função geradora para streaming de resposta
async def stream_gen(input_data):
    try:
        populacao = [criar_individuo(len(input_data.pesos)) for _ in range(input_data.tamanho_populacao)]
        
        for geracao in range(input_data.num_geracoes):
            pais = selecionar_pais(populacao, input_data.pesos, input_data.valores, input_data.capacidade)
            nova_geracao = []

            while len(nova_geracao) < input_data.tamanho_populacao:
                if len(pais) < 2:
                    break

                pai1, pai2 = random.sample(pais, 2)
                filho1, filho2 = crossover(pai1, pai2)
                nova_geracao.append(mutar(filho1, input_data.taxa_mutacao))
                nova_geracao.append(mutar(filho2, input_data.taxa_mutacao))

            populacao = nova_geracao[:input_data.tamanho_populacao]

            melhor_individuo = max(populacao, key=lambda ind: calcular_nota(ind, input_data.pesos, input_data.valores, input_data.capacidade))
            melhor_nota = calcular_nota(melhor_individuo, input_data.pesos, input_data.valores, input_data.capacidade)

            resultado = {"geracao": geracao + 1, "melhor_valor": melhor_nota}
            yield f"data: {json.dumps(resultado)}\n\n"
            await asyncio.sleep(1)  # Mantém a conexão ativa

        yield "data: [DONE]\n\n"
    except asyncio.CancelledError:
        print("Conexão encerrada pelo cliente.")

# Endpoint para executar o algoritmo com streaming
@app.post("/executar_algoritmo")
async def executar_algoritmo(input_data: AlgoritmoGeneticoInput):
    return StreamingResponse(stream_gen(input_data), media_type="text/event-stream")

import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import axios from "axios";

function App() {
  const [pesos, setPesos] = useState("2,3,5,7,1");
  const [valores, setValores] = useState("10,5,15,7,6");
  const [capacidade, setCapacidade] = useState(10);
  const [tamanhoPopulacao, setTamanhoPopulacao] = useState(10);
  const [numGeracoes, setNumGeracoes] = useState(20);
  const [taxaMutacao, setTaxaMutacao] = useState(0.1);
  const [historico, setHistorico] = useState([]);
  const [animacaoHistorico, setAnimacaoHistorico] = useState([]);

  useEffect(() => {
    if (historico.length > 0) {
      setAnimacaoHistorico([]);
      let index = 0;
      const interval = setInterval(() => {
        if (index < historico.length) {
          setAnimacaoHistorico((prev) => [...prev, historico[index]]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 500);
    }
  }, [historico]);

  const executarAlgoritmo = async () => {
    try {
      const payload = {
        pesos: pesos.split(",").map(Number),
        valores: valores.split(",").map(Number),
        capacidade: Number(capacidade),
        tamanho_populacao: Number(tamanhoPopulacao),
        num_geracoes: Number(numGeracoes),
        taxa_mutacao: Number(taxaMutacao),
      };

      console.log("Enviando payload:", payload); // AJUSTE AQUI (Debug no console)

      // AJUSTE AQUI: Definir a URL da API corretamente
      const apiBaseUrl = process.env.REACT_APP_API_URL || "https://didactic-garbanzo-q4g497wgwj9299rw-8000.app.github.dev";

      const response = await axios.post(
        `${apiBaseUrl}/executar_algoritmo`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          withCredentials: true
        }
      );

      console.log("Resposta da API:", response.data); // AJUSTE AQUI (Ver resposta no console)

      setHistorico(response.data.historico);
      
    } catch (error) {
      console.error("Erro ao executar o algoritmo:", error);

      if (error.response) {
        console.error("Erro da API:", error.response.data);
        if (error.response.status === 401) {
          console.error("Erro 401: Não autorizado. Verifique as permissões no backend.");
        }
      } else if (error.request) {
        console.error("Nenhuma resposta do servidor. O backend pode não estar rodando.");
      } else {
        console.error("Erro ao configurar a requisição.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 text-gray-700 p-6">
      <h1 className="text-2xl font-bold mb-6">Algoritmo Genético - Problema da Mochila</h1>
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <label>Pesos dos itens (separados por vírgula):</label>
        <input
          type="text"
          value={pesos}
          onChange={(e) => setPesos(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        />

        <label>Valores dos itens (separados por vírgula):</label>
        <input
          type="text"
          value={valores}
          onChange={(e) => setValores(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        />

        <label>Capacidade da Mochila:</label>
        <input
          type="number"
          value={capacidade}
          onChange={(e) => setCapacidade(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        />

        <label>Tamanho da População:</label>
        <input
          type="number"
          value={tamanhoPopulacao}
          onChange={(e) => setTamanhoPopulacao(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        />

        <label>Número de Gerações:</label>
        <input
          type="number"
          value={numGeracoes}
          onChange={(e) => setNumGeracoes(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        />

        <label>Taxa de Mutação:</label>
        <input
          type="number"
          step="0.01"
          value={taxaMutacao}
          onChange={(e) => setTaxaMutacao(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        />

        <button
          onClick={() => {
            console.log("Botão clicado! Chamando executarAlgoritmo()"); // 🔹 AJUSTE AQUI
            executarAlgoritmo();
            }
          }
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Executar Algoritmo
        </button>

      </div>

      {animacaoHistorico.length > 0 && (
        <div className="mt-8 w-full max-w-3xl bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Evolução das Gerações</h2>
          <Chart
            options={{
              chart: {
                type: "line",
                height: 250,
                zoom: { enabled: false },
              },
              xaxis: {
                categories: animacaoHistorico.map((gen) => `Geração ${gen.geracao}`),
              },
              yaxis: {
                title: { text: "Melhor Valor" },
              },
            }}
            series={[
              {
                name: "Melhor Valor",
                data: animacaoHistorico.map((gen) => gen.melhor_valor),
              },
            ]}
            type="line"
            height={250}
          />
        </div>
      )}
    </div>
  );
}

export default App;

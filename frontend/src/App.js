import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";

function App() {
  // Estados para entrada do usuário
  const [pesos, setPesos] = useState("2,3,5,7,1");
  const [valores, setValores] = useState("10,5,15,7,6");
  const [capacidade, setCapacidade] = useState(10);
  const [tamanhoPopulacao, setTamanhoPopulacao] = useState(10);
  const [numGeracoes, setNumGeracoes] = useState(20);
  const [taxaMutacao, setTaxaMutacao] = useState(0.1);

  // Estado para armazenar as gerações progressivamente
  const [historico, setHistorico] = useState([]);
  const [animacaoHistorico, setAnimacaoHistorico] = useState([]);

  // URL do backend
  const apiBaseUrl = "https://didactic-garbanzo-q4g497wgwj9299rw-8000.app.github.dev/"; // Ajuste se necessário

  // Atualiza o gráfico progressivamente
  useEffect(() => {
    if (historico.length > 0) {
      setAnimacaoHistorico([]); // Limpa o histórico da animação antes de começar
      let index = 0;
      const interval = setInterval(() => {
        if (index < historico.length) {
          setAnimacaoHistorico((prev) => [...prev, historico[index]]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 500); // Atualiza a cada 500ms
    }
  }, [historico]);

  // Função para iniciar a execução do algoritmo genético via SSE (EventSource)
  const executarAlgoritmo = async () => {
    setHistorico([]); // Limpa os dados anteriores

    const payload = {
      pesos: pesos.split(",").map(Number),
      valores: valores.split(",").map(Number),
      capacidade: Number(capacidade),
      tamanho_populacao: Number(tamanhoPopulacao),
      num_geracoes: Number(numGeracoes),
      taxa_mutacao: Number(taxaMutacao),
    };

    console.log("Enviando payload:", payload);

    try {
      const response = await fetch(`${apiBaseUrl}/executar_algoritmo`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        },
        body: JSON.stringify(payload),
        credentials: "include", // Para evitar bloqueio por CORS
        mode: "cors" // Garante que CORS seja respeitado
      });

      if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter((line) => line.startsWith("data:"));

        lines.forEach((line) => {
          const jsonData = JSON.parse(line.replace("data: ", ""));
          setHistorico((prev) => [...prev, jsonData]); // Atualiza o estado dinamicamente
        });
      }
    } catch (error) {
      console.error("Erro ao executar o algoritmo:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-6">
      <h1 className="text-2xl font-bold mb-6">Algoritmo Genético - Problema da Mochila</h1>

      {/* Container de Inputs */}
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">📌 Dados do Problema</h2>

        <label className="block text-gray-700">Pesos dos itens (separados por vírgula):</label>
        <input
          type="text"
          value={pesos}
          onChange={(e) => setPesos(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        />

        <label className="block text-gray-700">Valores dos itens (separados por vírgula):</label>
        <input
          type="text"
          value={valores}
          onChange={(e) => setValores(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        />

        <label className="block text-gray-700">Capacidade da Mochila:</label>
        <input
          type="number"
          value={capacidade}
          onChange={(e) => setCapacidade(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        />

        {/* Parâmetros do Algoritmo */}
        <h2 className="text-lg font-semibold mb-4">⚙️ Parâmetros do Algoritmo</h2>

        <label className="block text-gray-700">Tamanho da População:</label>
        <input
          type="number"
          value={tamanhoPopulacao}
          onChange={(e) => setTamanhoPopulacao(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        />

        <label className="block text-gray-700">Número de Gerações:</label>
        <input
          type="number"
          value={numGeracoes}
          onChange={(e) => setNumGeracoes(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        />

        <label className="block text-gray-700">Taxa de Mutação:</label>
        <input
          type="number"
          step="0.01"
          value={taxaMutacao}
          onChange={(e) => setTaxaMutacao(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        />

        <button
          onClick={executarAlgoritmo}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-2"
        >
          Executar Algoritmo
        </button>
      </div>

      {/* Gráfico Dinâmico */}
      {animacaoHistorico.length > 0 && (
        <div className="mt-8 w-full max-w-3xl bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">📈 Evolução das Gerações</h2>

          <Chart
            options={{
              chart: { type: "line", height: 250, zoom: { enabled: false } },
              xaxis: { categories: animacaoHistorico.map((gen) => `Geração ${gen.geracao}`) },
              yaxis: { title: { text: "Melhor Valor" } },
              stroke: { curve: "smooth", width: 4 },
              colors: ["#2563EB"],
            }}
            series={[{ name: "Melhor Valor", data: animacaoHistorico.map((gen) => gen.melhor_valor) }]}
            type="line"
            height={250}
          />
        </div>
      )}
    </div>
  );
}

export default App;

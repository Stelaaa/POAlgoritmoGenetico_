import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import backgroundImage from "./assets/background.png"; // ✅ Importando a imagem corretamente
import "./index.css"; // ✅ Importando Tailwind e estilos globais

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

  // URL do backend (sem a `/` no final)
  const apiBaseUrl = "https://didactic-garbanzo-q4g497wgwj9299rw-8000.app.github.dev";

  // Atualiza o gráfico progressivamente
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

  // Função para iniciar a execução do algoritmo genético via SSE (EventSource)
  const executarAlgoritmo = async () => {
    setHistorico([]);

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
          "Accept": "text/event-stream",
        },
        body: JSON.stringify(payload),
        credentials: "include",
        mode: "cors",
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
          setHistorico((prev) => [...prev, jsonData]);
        });
      }
    } catch (error) {
      console.error("Erro ao executar o algoritmo:", error);
    }
  };

  return (
    <div
      className="container"
      style={{
        backgroundImage: `url(${backgroundImage})`, // ✅ Definindo background corretamente
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        width: "100vw", // 🔥 Garante que cubra toda a largura
        height: "100vh", // 🔥 Evita corte na parte de baixo
        overflow: "hidden",
      }}
    >
      {/* Formulário do lado esquerdo */}
      <div className="formulario">
        <h1 className="text-2xl font-bold mb-6">Algoritmo Genético - Problema da Mochila</h1>
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

          <h2 className="text-lg font-semibold mb-4">⚙️ Parâmetros do Algoritmo</h2>

          <label className="block text-gray-700">Tamanho da População:</label>
          <input
            type="number"
            value={tamanhoPopulacao}
            onChange={(e) => setTamanhoPopulacao(Number(e.target.value))}
            className="w-full border rounded p-2 mb-4"
          />

          <button
            onClick={executarAlgoritmo}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-2"
          >
            Executar Algoritmo
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

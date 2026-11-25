// System Prompt exato definido na Aula 3
const SYSTEM_PROMPT = `Você é um mentor de carreiras.
Liste profissões que o usuário pode fazer uma graduação que tem correlação no Brasil.
Regras:
1. Liste profissões reais no Brasil
2. Seja breve.
3. Não use emojis.
4. Quando o usuário escrever que não gosta de fazer nada. Cuidado para não ser preconceituoso. GARANTA QUE VOCÊ NÃO RESPONDA NADA. Não fale nada.`;

// Exibe o System Prompt na interface ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("system-prompt-view").textContent = SYSTEM_PROMPT;

    const chaveSalva = sessionStorage.getItem("OPEN_ROUTER_KEY");
    if (chaveSalva) {
        document.getElementById("api-key").value = chaveSalva;
        atualizarStatusChave(true);
    }
});

// Aula 2: Gerenciamento seguro da chave no navegador (sem expor no GitHub)
function salvarChave() {
    const inputChave = document.getElementById("api-key").value.trim();
    if (!inputChave) {
        alert("Por favor, insira uma chave de API válida.");
        return;
    }
    sessionStorage.setItem("OPEN_ROUTER_KEY", inputChave);
    atualizarStatusChave(true);
}

function atualizarStatusChave(ativa) {
    const statusEl = document.getElementById("status-chave");
    if (ativa) {
        statusEl.textContent = "Chave salva temporariamente na sessão do navegador.";
        statusEl.classList.add("status-ok");
    } else {
        statusEl.textContent = "Nenhuma chave configurada nesta sessão.";
        statusEl.classList.remove("status-ok");
    }
}

// Aulas 1, 3 e 4: Chamada à API OpenRouter + Exibição de Tokens
async function consultarMentor() {
    const apiKey = document.getElementById("api-key").value.trim() || sessionStorage.getItem("OPEN_ROUTER_KEY");
    const userPrompt = document.getElementById("user-prompt").value.trim();
    const respostaEl = document.getElementById("resposta-texto");
    const btnEnviar = document.getElementById("btn-enviar");

    if (!apiKey) {
        alert("Insira sua API Key do OpenRouter na Seção 1 antes de continuar.");
        return;
    }

    if (!userPrompt) {
        alert("Digite suas afinidades ou interesses.");
        return;
    }

    // Estado de carregamento
    btnEnviar.disabled = true;
    btnEnviar.textContent = "Consultando...";
    respostaEl.textContent = "Gerando resposta...";

    try {
        // Endpoint padrão compatível com OpenAI utilizado pelo OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href,
                "X-Title": "Mentor de Carreiras Web"
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Erro ao comunicar com a API do OpenRouter.");
        }

        // Extrai o texto gerado (caso a regra 4 seja acionada, pode retornar string vazia)
        const textoGerado = data.choices?.[0]?.message?.content ?? "";
        respostaEl.textContent = textoGerado === "" ? "[Sem resposta — Regra 4 acionada]" : textoGerado;

        // Aula 4: Atualiza a contagem de tokens na tela
        const usage = data.usage || {};
        const promptTokens = usage.prompt_tokens || 0;
        const completionTokens = usage.completion_tokens || 0;
        const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens || 0;
        const totalTokens = usage.total_tokens || 0;

        document.getElementById("tok-entrada").textContent = promptTokens;
        document.getElementById("tok-saida").textContent = completionTokens;
        document.getElementById("tok-raciocinio").textContent = reasoningTokens;
        document.getElementById("tok-total").textContent = totalTokens;

    } catch (erro) {
        respostaEl.textContent = `Erro: ${erro.message}`;
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = "Consultar";
    }
}

const socket = io();

const nome = document.getElementById("nome");
const codigo = document.getElementById("codigo");
const mensagem = document.getElementById("mensagem");

const entrada = document.getElementById("entrada");
const salaElemento = document.getElementById("sala");
const jogoElemento = document.getElementById("jogo");
const resultadoElemento = document.getElementById("resultado");

let codigoAtual = null;
let souAnfitriao = false;
let partidaIniciada = false;
let respostaEnviada = false;
let resultadoRecebido = false;
let alternativasAtuais = [];
let rodadaAtual = 1;
let totalRodadas = 5;

let telaAtual = "entrada";

function mostrarTela(tela) {
    telaAtual = tela;
    entrada.hidden = tela !== "entrada";
    salaElemento.hidden = tela !== "sala";
    jogoElemento.hidden = tela !== "jogo";
    resultadoElemento.hidden = tela !== "resultado";
}

function mostrarMensagem(texto, tipo = "") {
    mensagem.textContent = texto;
    mensagem.className = tipo;
}

function entrarNaSala() {
    if (!nome.value.trim()) {
        mostrarMensagem("Digite o nome do administador.", "erro");
        nome.focus();
        return;
    }
    if (!codigo.value.trim()) {
        mostrarMensagem("Digite o código da sala.", "erro");
        codigo.focus();
        return;
    }
    mostrarMensagem("Entrando na sala...");
    socket.emit("entrarSala", { nome: nome.value.trim(), codigo: codigo.value.trim() });
}

document.getElementById("criar").addEventListener("click", () => {
    if (!nome.value.trim()) {
        mostrarMensagem("Digite o nome da sua empresa.", "erro");
        nome.focus();
        return;
    }
    socket.emit("criarSala", nome.value.trim());
    mostrarMensagem("Criando sala...");
});

document.getElementById("entrar").addEventListener("click", entrarNaSala);
codigo.addEventListener("input", () => { codigo.value = codigo.value.toUpperCase(); });

socket.on("connect", () => mostrarMensagem("Conectado ao servidor.", "sucesso"));
socket.on("disconnect", () => mostrarMensagem("Conexão perdida. Atualize a página para reconectar.", "erro"));

socket.on("salaCriada", dados => {
    codigoAtual = dados.codigo;
    history.replaceState(null, "", `?sala=${codigoAtual}`);
    mostrarMensagem("Sala criada com sucesso!", "sucesso");
});

socket.on("entrouSala", dados => {
    codigoAtual = dados.codigo;
    history.replaceState(null, "", `?sala=${codigoAtual}`);
    mostrarMensagem("Você entrou na sala!", "sucesso");
});

socket.on("estadoSala", dados => {
    if (dados.codigo !== codigoAtual) return;

    souAnfitriao = socket.id === dados.anfitriao;
    partidaIniciada = dados.iniciada;
    resultadoRecebido = dados.resultadoDisponivel;
    rodadaAtual = dados.rodadaAtual || 1;
    totalRodadas = dados.totalRodadas || 5;

    if (!partidaIniciada) mostrarTela("sala");
    document.getElementById("codigoSala").textContent = dados.codigo;
    document.getElementById("contador").textContent = `${dados.jogadores.length}/6`;

    const lista = document.getElementById("jogadores");
    lista.replaceChildren();
    dados.jogadores.forEach(jogador => {
        const item = document.createElement("li");
        const nomeJogador = document.createElement("span");
        nomeJogador.textContent = jogador.nome;
        item.appendChild(nomeJogador);

        if (jogador.id === dados.anfitriao) {
            const etiqueta = document.createElement("span");
            etiqueta.textContent = "Anfitrião";
            etiqueta.className = "etiqueta-anfitriao";
            item.appendChild(etiqueta);
        }

        if (dados.iniciada && !dados.resultadoDisponivel && !dados.partidaFinalizada) {
            const status = document.createElement("span");
            status.textContent = jogador.respondeu ? "Respondeu" : "Pendente";
            status.className = jogador.respondeu ? "status-ok" : "status-pendente";
            item.appendChild(status);
        }
        lista.appendChild(item);
    });

    const iniciar = document.getElementById("iniciar");
    iniciar.hidden = dados.iniciada || !souAnfitriao;
    iniciar.disabled = dados.jogadores.length < 2;

    document.getElementById("avisoSala").textContent = dados.partidaFinalizada
        ? "Partida finalizada!"
        : dados.iniciada
            ? `Partida em andamento — rodada ${rodadaAtual} de ${totalRodadas}.`
            : dados.jogadores.length < 2
                ? "Convide pelo menos outra empresa para começar."
                : souAnfitriao
                    ? "Todas as empresas estão prontas? Inicie a partida."
                    : "Aguardando o anfitrião iniciar a partida.";

    if (!dados.iniciada) document.getElementById("avisoInicio").textContent = "";
    if (dados.iniciada && !dados.resultadoDisponivel && !resultadoRecebido) {
        document.getElementById("avisoInicio").textContent = `A partida está em andamento — rodada ${rodadaAtual} de ${totalRodadas}.`;
    }

    const botaoProxima = document.getElementById("proximaRodada");
    if (botaoProxima && (!souAnfitriao || !dados.resultadoDisponivel || dados.partidaFinalizada)) {
        botaoProxima.hidden = true;
    }
});

document.getElementById("copiar").addEventListener("click", async () => {
    if (!codigoAtual) return;
    const link = `${location.origin}${location.pathname}?sala=${codigoAtual}`;
    try {
        await navigator.clipboard.writeText(link);
        mostrarMensagem("Link de convite copiado!", "sucesso");
    } catch {
        mostrarMensagem(`Copie este link: ${link}`, "erro");
    }
});

document.getElementById("iniciar").addEventListener("click", () => {
    if (!codigoAtual || !souAnfitriao) return;
    document.getElementById("iniciar").disabled = true;
    socket.emit("iniciarPartida", codigoAtual);
});

socket.on("desafioAtual", desafio => {
    partidaIniciada = true;
    respostaEnviada = false;
    resultadoRecebido = false;
    rodadaAtual = desafio.rodadaAtual;
    totalRodadas = desafio.totalRodadas;
    alternativasAtuais = desafio.alternativas;

    mostrarTela("jogo");
    document.getElementById("seloRodada").textContent = `Rodada ${rodadaAtual} de ${totalRodadas}`;

    document.getElementById("tituloDesafio").textContent = desafio.titulo;
    document.getElementById("descricaoDesafio").textContent = desafio.descricao;

    const dados = document.getElementById("dadosFinanceiros");
    dados.replaceChildren();
    desafio.financeiro.forEach(item => {
        const cartao = document.createElement("div");
        cartao.className = "cartao-financeiro";
        const titulo = document.createElement("span");
        titulo.textContent = item.nome;
        const valor = document.createElement("strong");
        valor.textContent = item.valor.toLocaleString("pt-BR", {
            style: "currency", currency: "BRL", maximumFractionDigits: 0
        });
        cartao.append(titulo, valor);
        dados.appendChild(cartao);
    });

    const container = document.getElementById("alternativas");
    container.replaceChildren();

    desafio.alternativas.forEach((alternativa, indice) => {
        const botao = document.createElement("button");
        // Todas as alternativas usam a mesma classe: nenhuma cor indica a resposta correta.
        botao.className = "alternativa";
        botao.type = "button";

        const numero = document.createElement("strong");
        numero.textContent = `Alternativa ${indice + 1}`;
        const texto = document.createElement("span");
        texto.textContent = alternativa.texto;
        botao.append(numero, texto);

        botao.addEventListener("click", () => {
            if (respostaEnviada || resultadoRecebido) return;
            respostaEnviada = true;
            container.querySelectorAll("button").forEach(item => { item.disabled = true; });
            document.getElementById("statusResposta").textContent =
                "Resposta registrada. Aguarde as outras empresas.";
            socket.emit("enviarResposta", { codigo: codigoAtual, escolha: indice });
        });
        container.appendChild(botao);
    });

    document.getElementById("statusResposta").textContent = "Escolha uma das quatro alternativas.";
    const botaoProxima = document.getElementById("proximaRodada");
    if (botaoProxima) botaoProxima.remove();
});

socket.on("respostaRegistrada", () => {
    document.getElementById("statusResposta").textContent =
        "Sua resposta foi registrada! O resultado será revelado quando todas responderem.";
});

socket.on("resultadoRodada", dados => {
    resultadoRecebido = true;
    mostrarTela("resultado");
    document.getElementById("statusResposta").textContent = `Rodada ${dados.rodadaAtual} concluída.`;

    // O conteúdo didático só chega do servidor depois que todas as empresas respondem.
    let blocoAprendizado = document.getElementById("blocoAprendizado");
    if (!blocoAprendizado) {
        blocoAprendizado = document.createElement("section");
        blocoAprendizado.id = "blocoAprendizado";
        blocoAprendizado.className = "bloco-aprendizado";
        const tituloAprendizado = document.createElement("h3");
        tituloAprendizado.textContent = "Conceito do capítulo 12";
        const conceito = document.createElement("h4");
        conceito.id = "conceitoRodada";
        const textoAprendizado = document.createElement("p");
        textoAprendizado.id = "textoAprendizado";
        blocoAprendizado.append(tituloAprendizado, conceito, textoAprendizado);
        document.getElementById("resultado").insertBefore(
            blocoAprendizado,
            document.getElementById("explicacoes")
        );
    }
    document.getElementById("conceitoRodada").textContent = dados.conceito || "Aprendizado financeiro";
    document.getElementById("textoAprendizado").textContent = dados.aprendizado || "Revise as consequências das decisões e relacione-as ao controle financeiro da empresa.";

    const explicacoes = document.getElementById("explicacoes");
    explicacoes.replaceChildren();
    dados.explicacoes.forEach(item => {
        const bloco = document.createElement("div");
        bloco.className = "explicacao";
        const titulo = document.createElement("h4");
        titulo.textContent = item.classificacao;
        const texto = document.createElement("p");
        texto.textContent = item.explicacao;
        bloco.append(titulo, texto);
        explicacoes.appendChild(bloco);
    });

    const ranking = document.getElementById("ranking");
    ranking.replaceChildren();
    dados.resultados.forEach(item => {
        const linha = document.createElement("li");
        const nomeEmpresa = document.createElement("strong");
        const detalhes = document.createElement("p");
        nomeEmpresa.textContent = item.nome;
        detalhes.textContent =
            `Escolha: ${item.classificacao} | ` +
            `${item.pontos > 0 ? "+" : ""}${item.pontos} pontos | ` +
            `Total: ${item.pontuacaoTotal} pontos`;
        linha.append(nomeEmpresa, detalhes);

        const suaEscolha = alternativasAtuais[item.escolha];
        if (suaEscolha) {
            const textoEscolha = document.createElement("p");
            textoEscolha.textContent = `Alternativa escolhida: ${suaEscolha.texto}`;
            linha.appendChild(textoEscolha);
        }

        const explicacao = document.createElement("p");
        explicacao.textContent = item.explicacao;
        linha.appendChild(explicacao);
        ranking.appendChild(linha);
    });

    const fimRodada = document.getElementById("fimRodada");
    fimRodada.textContent = dados.partidaFinalizada
        ? "Todas as cinco rodadas foram concluídas! Confira o placar final."
        : `Rodada ${dados.rodadaAtual} de ${dados.totalRodadas} concluída. Aguarde o anfitrião iniciar a próxima rodada.`;

    let botaoProxima = document.getElementById("proximaRodada");
    if (!dados.partidaFinalizada && souAnfitriao) {
        if (!botaoProxima) {
            botaoProxima = document.createElement("button");
            botaoProxima.id = "proximaRodada";
            botaoProxima.type = "button";
            botaoProxima.className = "botao-principal";
            botaoProxima.addEventListener("click", () => {
                botaoProxima.disabled = true;
                socket.emit("proximaRodada", codigoAtual);
            });
            fimRodada.after(botaoProxima);
        }
        botaoProxima.textContent = `Iniciar rodada ${dados.rodadaAtual + 1}`;
        botaoProxima.hidden = false;
        botaoProxima.disabled = false;
    }

    mostrarMensagem("Todas as empresas responderam. Resultado revelado!", "sucesso");
});

socket.on("partidaFinalizada", dados => {
    mostrarTela("resultado");
    const fimRodada = document.getElementById("fimRodada");
    fimRodada.textContent = "Partida finalizada! Placar definitivo:";
    const ranking = document.getElementById("ranking");
    ranking.replaceChildren();

    dados.placarFinal.forEach((item, indice) => {
        const linha = document.createElement("li");
        const titulo = document.createElement("strong");
        titulo.textContent = `${indice + 1}º lugar — ${item.nome}`;
        const pontos = document.createElement("p");
        pontos.textContent = `${item.pontuacaoTotal} pontos`;
        linha.append(titulo, pontos);
        ranking.appendChild(linha);
    });

    const botaoProxima = document.getElementById("proximaRodada");
    if (botaoProxima) botaoProxima.remove();
    mostrarMensagem("Partida finalizada! Veja a classificação final.", "sucesso");
});

socket.on("erroJogo", texto => {
    document.getElementById("iniciar").disabled = false;
    const botaoProxima = document.getElementById("proximaRodada");
    if (botaoProxima) botaoProxima.disabled = false;
    mostrarMensagem(texto, "erro");
});

mostrarTela("entrada");

const codigoConvite = new URLSearchParams(location.search).get("sala");
if (codigoConvite) {
    codigo.value = codigoConvite.toUpperCase();
    mostrarMensagem("Convite detectado. Digite o nome da empresa e entre.");
}

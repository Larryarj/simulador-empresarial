const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const salas = new Map();

// Oito cenários empresariais. As classificações e pontuações ficam no servidor
// e só são enviadas aos jogadores depois que todos responderem.
const desafios = [
    {
        titulo: "Rodada 1 — Mercado Econômico",
        descricao: "Sua empresa precisa organizar os pagamentos sem comprometer a continuidade das operações.",
        conceito: "Liquidez e fluxo de caixa",
        aprendizado: "Liquidez é a capacidade de cumprir compromissos financeiros no prazo. O fluxo de caixa organiza as entradas e saídas previstas e ajuda a identificar períodos em que o dinheiro disponível pode não ser suficiente. Por isso, é importante planejar recebimentos, pagamentos e possíveis necessidades de crédito.",
        financeiro: [
            { nome: "Dinheiro disponível", valor: 2000 },
            { nome: "Pagamento aos fornecedores", valor: 5000 },
            { nome: "Salários e outras despesas próximas", valor: 2000 },
            { nome: "Recebimentos previstos", valor: 4000 }
        ],
        alternativas: [
            {
                texto: "Ignorar os pagamentos e esperar que a situação se resolva.",
                classificacao: "Muito ruim",
                pontos: -10,
                explicacao: "Ignorar as obrigações pode gerar multas, prejudicar o fornecimento e comprometer a confiança dos parceiros."
            },
            {
                texto: "Usar todo o caixa para pagar parcialmente os fornecedores, sem planejar as demais despesas.",
                classificacao: "Ruim",
                pontos: -3,
                explicacao: "Um pagamento parcial sem planejamento pode deixar a empresa sem recursos para despesas essenciais."
            },
            {
                texto: "Negociar prazos com fornecedores e organizar as datas de pagamento.",
                classificacao: "Boa",
                pontos: 5,
                explicacao: "Negociar prazos pode aliviar a pressão sobre o caixa e ajudar a organizar as obrigações."
            },
            {
                texto: "Negociar prazos, priorizar despesas essenciais e buscar antecipar recebimentos com custo controlado.",
                classificacao: "Muito boa",
                pontos: 10,
                explicacao: "Combinar negociação, priorização e planejamento dos recebimentos tende a dar mais controle sobre o fluxo de caixa."
            }
        ]
    },
    {
        titulo: "Rodada 2 — Fábrica de Móveis Horizonte",
        descricao: "A fábrica recebeu uma oportunidade de ampliar a produção, mas precisa decidir como investir sem colocar em risco as despesas atuais.",
        conceito: "Captação de recursos e capital de giro",
        aprendizado: "O capítulo explica que a empresa pode captar recursos por diferentes meios, como capital próprio, empréstimos, financiamentos e condições negociadas com fornecedores. Antes de investir, é importante comparar as condições e preservar recursos para manter as operações do dia a dia — o capital de giro.",
        financeiro: [
            { nome: "Caixa disponível", valor: 18000 },
            { nome: "Custo estimado das máquinas", valor: 30000 },
            { nome: "Despesas mensais", valor: 12000 },
            { nome: "Capital de giro mínimo desejado", valor: 15000 }
        ],
        alternativas: [
            {
                texto: "Usar todo o caixa na entrada das máquinas, mesmo ficando sem dinheiro para as despesas.",
                classificacao: "Muito ruim",
                pontos: -10,
                explicacao: "Investir sem preservar dinheiro para a operação pode impedir o pagamento de salários, contas e fornecedores."
            },
            {
                texto: "Contratar imediatamente um empréstimo de alto custo para comprar todas as máquinas.",
                classificacao: "Ruim",
                pontos: -3,
                explicacao: "A expansão pode aumentar a produção, mas um empréstimo caro e assumido sem análise pode comprometer o caixa futuro."
            },
            {
                texto: "Adiar a compra por um curto período e juntar recursos, mantendo o capital de giro protegido.",
                classificacao: "Boa",
                pontos: 5,
                explicacao: "Adiar o investimento pode reduzir o risco financeiro, embora a empresa possa perder parte da oportunidade de expansão."
            },
            {
                texto: "Comparar opções de financiamento, negociar condições com o fornecedor e manter uma reserva para as despesas operacionais.",
                classificacao: "Muito boa",
                pontos: 10,
                explicacao: "Avaliar o custo total, negociar e proteger o capital de giro permite buscar crescimento sem ignorar a capacidade de pagamento."
            }
        ]
    },
    {
        titulo: "Rodada 3 — Padaria Pão Quentinho",
        descricao: "As vendas cresceram, mas o dinheiro disponível continua baixo. A gestão suspeita de desperdício, custos elevados e preços mal calculados.",
        conceito: "Rentabilidade e controle financeiro",
        aprendizado: "Rentabilidade está relacionada ao retorno obtido com os recursos investidos. Para avaliar o desempenho, não basta olhar o faturamento: é preciso acompanhar custos, despesas e resultados. O controle financeiro fornece informações para identificar desperdícios e tomar decisões com base em dados.",
        financeiro: [
            { nome: "Faturamento mensal", valor: 45000 },
            { nome: "Custos e despesas mensais", valor: 43000 },
            { nome: "Perdas estimadas com desperdício", valor: 3500 },
            { nome: "Caixa disponível", valor: 5000 }
        ],
        alternativas: [
            {
                texto: "Aumentar bastante todos os preços imediatamente, sem analisar custos ou concorrência.",
                classificacao: "Muito ruim",
                pontos: -10,
                explicacao: "Aumentos sem análise podem afastar clientes e não resolvem necessariamente desperdícios ou custos mal controlados."
            },
            {
                texto: "Reduzir a qualidade dos ingredientes para tentar diminuir os gastos rapidamente.",
                classificacao: "Ruim",
                pontos: -3,
                explicacao: "A redução de qualidade pode prejudicar a reputação, a satisfação dos clientes e as vendas recorrentes."
            },
            {
                texto: "Registrar os custos dos produtos e acompanhar diariamente as perdas de ingredientes.",
                classificacao: "Boa",
                pontos: 5,
                explicacao: "Medir custos e desperdícios ajuda a descobrir onde o dinheiro está sendo perdido e embasa decisões melhores."
            },
            {
                texto: "Controlar estoque e produção, calcular a margem de cada produto e ajustar preços e compras com base nos dados.",
                classificacao: "Muito boa",
                pontos: 10,
                explicacao: "Combinar controle de perdas, análise de margem e planejamento de compras atua nas causas do baixo resultado sem depender de cortes cegos."
            }
        ]
    },
    {
        titulo: "Rodada 4 — Loja de Roupas Estilo Jovem",
        descricao: "Parte do estoque está parada há meses. A loja precisa liberar recursos para comprar produtos mais procurados sem destruir sua margem de lucro.",
        conceito: "Ativos circulantes e capital de giro",
        aprendizado: "Estoques e contas a receber fazem parte dos recursos que circulam nas operações da empresa. Quando muito dinheiro fica preso em mercadorias paradas, sobra menos caixa para pagar compromissos. Acompanhar o estoque, as contas a receber e as contas a pagar ajuda a administrar o capital de giro.",
        financeiro: [
            { nome: "Valor de custo do estoque parado", valor: 22000 },
            { nome: "Caixa disponível", valor: 6000 },
            { nome: "Contas a pagar no mês", valor: 9000 },
            { nome: "Orçamento para nova coleção", valor: 12000 }
        ],
        alternativas: [
            {
                texto: "Continuar comprando grandes quantidades da nova coleção e deixar o estoque antigo como está.",
                classificacao: "Muito ruim",
                pontos: -10,
                explicacao: "Aumentar compras sem resolver o estoque parado prende ainda mais dinheiro em mercadorias e pressiona o caixa."
            },
            {
                texto: "Liquidar todo o estoque antigo por qualquer preço, sem calcular o prejuízo ou separar os produtos.",
                classificacao: "Ruim",
                pontos: -3,
                explicacao: "Uma liquidação indiscriminada pode destruir margem em produtos que ainda poderiam ser vendidos por um preço melhor."
            },
            {
                texto: "Fazer uma promoção planejada para os itens parados e limitar temporariamente as compras da nova coleção.",
                classificacao: "Boa",
                pontos: 5,
                explicacao: "A promoção seletiva e a redução de compras ajudam a liberar caixa, embora exijam acompanhamento dos resultados."
            },
            {
                texto: "Classificar o estoque por procura e margem, criar promoções direcionadas e comprar a nova coleção em lotes menores.",
                classificacao: "Muito boa",
                pontos: 10,
                explicacao: "Decidir com base na procura e na margem, enquanto se controla o volume das novas compras, equilibra caixa, estoque e vendas."
            }
        ]
    },
    {
        titulo: "Rodada 5 — Empresa de Tecnologia Conecta+",
        descricao: "A empresa pode investir em um novo sistema para atender mais clientes, mas precisa avaliar custo, risco, retorno e recursos disponíveis.",
        conceito: "Decisões de investimento, liquidez e rentabilidade",
        aprendizado: "Uma decisão financeira deve considerar tanto o retorno esperado quanto a capacidade de manter dinheiro disponível para os compromissos. Antes de investir, estime os custos, avalie os benefícios, compare formas de financiamento e verifique se a empresa continuará com recursos para operar.",
        financeiro: [
            { nome: "Caixa disponível", valor: 40000 },
            { nome: "Custo do novo sistema", valor: 55000 },
            { nome: "Despesas operacionais mensais", valor: 25000 },
            { nome: "Receita mensal atual", valor: 38000 }
        ],
        alternativas: [
            {
                texto: "Comprar o sistema imediatamente, usando todo o caixa e sem avaliar a integração ou os custos futuros.",
                classificacao: "Muito ruim",
                pontos: -10,
                explicacao: "Uma decisão sem análise pode deixar a empresa sem reserva e gerar custos extras de implantação, manutenção e treinamento."
            },
            {
                texto: "Desistir da ideia permanentemente porque o preço inicial é maior que o caixa disponível.",
                classificacao: "Ruim",
                pontos: -3,
                explicacao: "Descartar a oportunidade sem estudar alternativas pode impedir um crescimento viável; o preço inicial, sozinho, não responde se o investimento compensa."
            },
            {
                texto: "Solicitar demonstrações e estimar os benefícios antes de decidir, sem assumir compromissos imediatos.",
                classificacao: "Boa",
                pontos: 5,
                explicacao: "Levantar informações reduz a incerteza e ajuda a evitar uma compra precipitada, embora ainda seja necessário decidir como financiar o projeto."
            },
            {
                texto: "Calcular o retorno esperado, verificar custos de implantação, comparar fornecedores e planejar financiamento sem consumir a reserva operacional.",
                classificacao: "Muito boa",
                pontos: 10,
                explicacao: "A análise de retorno, dos custos totais e das formas de financiamento permite avaliar se o sistema é sustentável e preservar recursos para a operação."
            }
        ]
    }
    ,
    {
        titulo: "Rodada 6 — Oficina Mecânica Giro Certo",
        descricao: "A oficina está vendendo mais serviços, mas o proprietário não sabe se o negócio está realmente melhorando. A equipe precisa avaliar os resultados antes de decidir como agir.",
        conceito: "Indicadores de desempenho financeiro",
        aprendizado: "Acompanhar indicadores como receita, custos, lucro e margem ajuda a avaliar o desempenho do negócio ao longo do tempo. Aumentar as vendas não garante maior lucro se os custos crescerem ainda mais. Comparar os resultados com metas e períodos anteriores ajuda a identificar problemas e tomar decisões.",
        financeiro: [
            { nome: "Receita do mês", valor: 50000 },
            { nome: "Custos e despesas do mês", valor: 47000 },
            { nome: "Receita do mês anterior", valor: 42000 },
            { nome: "Meta de lucro mensal", valor: 6000 }
        ],
        alternativas: [
            {
                texto: "Comemorar o aumento das vendas e ignorar os custos, pois a receita cresceu em relação ao mês anterior.",
                classificacao: "Muito ruim",
                pontos: -10,
                explicacao: "A receita cresceu, mas o resultado atual é de apenas R$ 3.000, abaixo da meta de R$ 6.000. Ignorar os custos esconde o problema de rentabilidade."
            },
            {
                texto: "Cortar despesas de forma imediata e igual para todas as áreas, sem verificar quais custos estão aumentando.",
                classificacao: "Ruim",
                pontos: -3,
                explicacao: "Reduzir gastos sem analisar sua origem pode prejudicar a qualidade do serviço e não resolver as causas do resultado abaixo da meta."
            },
            {
                texto: "Comparar receita e despesas com os meses anteriores para identificar onde houve aumento de custos.",
                classificacao: "Boa",
                pontos: 5,
                explicacao: "A comparação dos resultados ajuda a localizar variações relevantes e é um primeiro passo para melhorar o desempenho."
            },
            {
                texto: "Acompanhar mensalmente receita, custos, lucro e margem, comparar com metas e definir ações para corrigir os desvios.",
                classificacao: "Muito boa",
                pontos: 10,
                explicacao: "Indicadores e metas permitem entender se o crescimento é rentável, identificar desvios e acompanhar se as medidas corretivas funcionam."
            }
        ]
    },
    {
        titulo: "Rodada 7 — Distribuidora Norte Sul",
        descricao: "A distribuidora vende a prazo para clientes e também compra mercadorias com prazo de pagamento. O gerente precisa entender por que falta dinheiro mesmo quando as vendas parecem boas.",
        conceito: "Ciclo de caixa e contas a pagar e receber",
        aprendizado: "O ciclo de caixa está relacionado ao tempo entre o desembolso para manter a operação e o recebimento das vendas. Vender a prazo pode aumentar a receita registrada, mas o dinheiro só entra depois. Controlar vencimentos, negociar prazos e acompanhar a inadimplência ajuda a evitar falta de caixa.",
        financeiro: [
            { nome: "Contas a receber nos próximos 30 dias", valor: 28000 },
            { nome: "Contas a pagar nos próximos 15 dias", valor: 35000 },
            { nome: "Caixa disponível", valor: 9000 },
            { nome: "Clientes com pagamentos atrasados", valor: 8000 }
        ],
        alternativas: [
            {
                texto: "Continuar vendendo a prazo sem analisar os vencimentos e usar o caixa disponível para novas compras.",
                classificacao: "Muito ruim",
                pontos: -10,
                explicacao: "As obrigações vencem antes de parte dos recebimentos e o caixa é insuficiente para cobrir a diferença. Ignorar os prazos amplia o risco de atraso."
            },
            {
                texto: "Suspender todas as vendas a prazo imediatamente, sem avaliar os clientes nem os efeitos nas vendas.",
                classificacao: "Ruim",
                pontos: -3,
                explicacao: "A medida pode reduzir parte do risco, mas também afastar bons clientes. É melhor avaliar limites de crédito, atrasos e prazos."
            },
            {
                texto: "Entrar em contato com clientes atrasados e organizar um calendário de pagamentos e recebimentos.",
                classificacao: "Boa",
                pontos: 5,
                explicacao: "Cobrança organizada e calendário financeiro melhoram a visibilidade do caixa, embora também seja necessário negociar obrigações próximas."
            },
            {
                texto: "Projetar o caixa por vencimento, negociar prazos com fornecedores, intensificar a cobrança e revisar critérios de crédito dos clientes.",
                classificacao: "Muito boa",
                pontos: 10,
                explicacao: "A ação combina controle do ciclo de caixa com negociação dos prazos e prevenção de novos atrasos, ajudando a alinhar entradas e saídas."
            }
        ]
    },
    {
        titulo: "Rodada 8 — Mercado Boa Compra",
        descricao: "O mercado tem vendas elevadas, estoque cheio e pagamentos próximos. O proprietário precisa usar os registros financeiros para entender a situação real e decidir se pode ampliar as compras.",
        conceito: "Demonstrações financeiras e projeção de resultados",
        aprendizado: "Registros financeiros organizados e relatórios de receitas, custos, despesas, ativos e obrigações ajudam a compreender a situação do negócio. Projetar resultados e conferir dados antes de assumir novos compromissos reduz o risco de decisões baseadas apenas na impressão de que as vendas estão boas.",
        financeiro: [
            { nome: "Vendas do mês", valor: 80000 },
            { nome: "Custos e despesas estimados", valor: 73000 },
            { nome: "Estoque atual a preço de custo", valor: 45000 },
            { nome: "Contas a pagar nos próximos 10 dias", valor: 22000 }
        ],
        alternativas: [
            {
                texto: "Ampliar imediatamente as compras porque o mercado vendeu R$ 80.000 no mês.",
                classificacao: "Muito ruim",
                pontos: -10,
                explicacao: "As vendas, isoladamente, não mostram quanto dinheiro está disponível nem se os compromissos próximos podem ser pagos. O estoque já é elevado."
            },
            {
                texto: "Decidir apenas pelo saldo bancário de hoje, sem conferir contas a pagar, estoque ou custos.",
                classificacao: "Ruim",
                pontos: -3,
                explicacao: "O saldo de um único dia não mostra obrigações futuras, mercadorias paradas ou a rentabilidade real do período."
            },
            {
                texto: "Conferir receitas, custos, despesas, estoque e contas a pagar antes de aprovar novas compras.",
                classificacao: "Boa",
                pontos: 5,
                explicacao: "Reunir os dados principais melhora a decisão e evita comprometer recursos sem entender as necessidades do negócio."
            },
            {
                texto: "Atualizar os registros financeiros, projetar o caixa e o resultado dos próximos períodos e definir limites de compra conforme a demanda e os vencimentos.",
                classificacao: "Muito boa",
                pontos: 10,
                explicacao: "Registros confiáveis e projeções permitem avaliar rentabilidade, liquidez e necessidade de estoque antes de assumir novos compromissos."
            }
        ]
    }

];

function gerarCodigo() {
    let codigo;
    do {
        codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (salas.has(codigo));
    return codigo;
}

function desafioAtualDaSala(sala) {
    return desafios[sala.rodadaAtual];
}

function dadosPublicosSala(sala) {
    return {
        anfitriao: sala.anfitriao,
        jogadores: [...sala.jogadores.entries()].map(([id, jogador]) => ({
            id,
            nome: jogador.nome,
            respondeu: sala.respostas.has(id)
        })),
        iniciada: sala.iniciada,
        resultadoDisponivel: sala.resultadoDisponivel,
        rodadaAtual: sala.rodadaAtual + 1,
        totalRodadas: desafios.length,
        partidaFinalizada: sala.partidaFinalizada
    };
}

function atualizarSala(codigo) {
    const sala = salas.get(codigo);
    if (!sala) return;
    io.to(codigo).emit("estadoSala", { codigo, ...dadosPublicosSala(sala) });
}

function enviarDesafio(codigo) {
    const sala = salas.get(codigo);
    if (!sala) return;
    const desafio = desafioAtualDaSala(sala);

    io.to(codigo).emit("desafioAtual", {
        rodadaAtual: sala.rodadaAtual + 1,
        totalRodadas: desafios.length,
        titulo: desafio.titulo,
        descricao: desafio.descricao,
        financeiro: desafio.financeiro,
        // Nunca enviar classificação, pontos ou explicação antes das respostas.
        alternativas: desafio.alternativas.map(({ texto }) => ({ texto }))
    });
}

function sairDaSala(socket, codigo) {
    const sala = salas.get(codigo);
    if (!sala || !sala.jogadores.has(socket.id)) return;

    sala.jogadores.delete(socket.id);
    sala.respostas.delete(socket.id);
    socket.leave(codigo);

    if (sala.jogadores.size === 0) {
        salas.delete(codigo);
        return;
    }

    if (sala.anfitriao === socket.id) {
        sala.anfitriao = sala.jogadores.keys().next().value;
    }

    if (
        sala.iniciada &&
        !sala.resultadoDisponivel &&
        sala.jogadores.size >= 1 &&
        [...sala.jogadores.keys()].every(id => sala.respostas.has(id))
    ) {
        revelarResultado(codigo);
    }

    atualizarSala(codigo);
}

function revelarResultado(codigo) {
    const sala = salas.get(codigo);
    if (!sala || sala.resultadoDisponivel || sala.partidaFinalizada) return;

    const desafio = desafioAtualDaSala(sala);
    sala.resultadoDisponivel = true;

    const resultados = [...sala.jogadores.entries()].map(([id, jogador]) => {
        const indice = sala.respostas.get(id);
        const alternativa = desafio.alternativas[indice];
        jogador.pontuacao += alternativa.pontos;

        return {
            id,
            nome: jogador.nome,
            escolha: indice,
            classificacao: alternativa.classificacao,
            pontos: alternativa.pontos,
            pontuacaoTotal: jogador.pontuacao,
            explicacao: alternativa.explicacao
        };
    });

    resultados.sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

    io.to(codigo).emit("resultadoRodada", {
        rodadaAtual: sala.rodadaAtual + 1,
        totalRodadas: desafios.length,
        partidaFinalizada: sala.rodadaAtual === desafios.length - 1,
        conceito: desafio.conceito,
        aprendizado: desafio.aprendizado,
        resultados,
        explicacoes: desafio.alternativas.map(alternativa => ({
            classificacao: alternativa.classificacao,
            explicacao: alternativa.explicacao
        }))
    });

    if (sala.rodadaAtual === desafios.length - 1) {
        sala.partidaFinalizada = true;
        const placarFinal = [...sala.jogadores.entries()]
            .map(([id, jogador]) => ({ id, nome: jogador.nome, pontuacaoTotal: jogador.pontuacao }))
            .sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);
        io.to(codigo).emit("partidaFinalizada", { placarFinal });
    }

    atualizarSala(codigo);
}

io.on("connection", socket => {
    socket.on("criarSala", nome => {
        for (const sala of salas.values()) {
            if (sala.jogadores.has(socket.id)) {
                socket.emit("erroJogo", "Você já está em uma sala.");
                return;
            }
        }

        nome = String(nome || "").trim().slice(0, 30);
        if (!nome) {
            socket.emit("erroJogo", "Digite o nome da sua empresa.");
            return;
        }

        const codigo = gerarCodigo();
        const sala = {
            anfitriao: socket.id,
            jogadores: new Map(),
            iniciada: false,
            resultadoDisponivel: false,
            partidaFinalizada: false,
            rodadaAtual: 0,
            respostas: new Map()
        };

        sala.jogadores.set(socket.id, { nome, pontuacao: 0 });
        salas.set(codigo, sala);
        socket.join(codigo);
        socket.emit("salaCriada", { codigo });
        atualizarSala(codigo);
    });

    socket.on("entrarSala", dados => {
        const codigo = String(dados?.codigo || "").trim().toUpperCase();
        const nome = String(dados?.nome || "").trim().slice(0, 30);
        const sala = salas.get(codigo);

        if (!nome) return socket.emit("erroJogo", "Digite o nome da sua empresa.");
        if (!sala) return socket.emit("erroJogo", "Sala não encontrada.");
        if (sala.iniciada) return socket.emit("erroJogo", "A partida já começou.");
        if (sala.jogadores.size >= 6) return socket.emit("erroJogo", "A sala está cheia.");

        for (const outraSala of salas.values()) {
            if (outraSala.jogadores.has(socket.id)) {
                socket.emit("erroJogo", "Você já está em uma sala.");
                return;
            }
        }

        sala.jogadores.set(socket.id, { nome, pontuacao: 0 });
        socket.join(codigo);
        socket.emit("entrouSala", { codigo });
        atualizarSala(codigo);
    });

    socket.on("iniciarPartida", codigoRecebido => {
        const codigo = String(codigoRecebido || "").toUpperCase();
        const sala = salas.get(codigo);

        if (!sala) return socket.emit("erroJogo", "Sala não encontrada.");
        if (socket.id !== sala.anfitriao) return socket.emit("erroJogo", "Somente o anfitrião pode iniciar.");
        if (sala.iniciada) return socket.emit("erroJogo", "A partida já começou.");
        if (sala.jogadores.size < 2) return socket.emit("erroJogo", "São necessárias pelo menos 2 empresas.");

        sala.iniciada = true;
        sala.resultadoDisponivel = false;
        sala.rodadaAtual = 0;
        sala.respostas.clear();
        atualizarSala(codigo);
        enviarDesafio(codigo);
    });

    socket.on("enviarResposta", dados => {
        const codigo = String(dados?.codigo || "").toUpperCase();
        const sala = salas.get(codigo);
        const indice = dados?.escolha;

        if (!sala || !sala.iniciada || sala.resultadoDisponivel || sala.partidaFinalizada) {
            return socket.emit("erroJogo", "Esta rodada não está recebendo respostas.");
        }
        if (!sala.jogadores.has(socket.id)) return socket.emit("erroJogo", "Você não pertence a esta sala.");

        const desafio = desafioAtualDaSala(sala);
        if (!Number.isInteger(indice) || indice < 0 || indice >= desafio.alternativas.length) {
            return socket.emit("erroJogo", "Alternativa inválida.");
        }
        if (sala.respostas.has(socket.id)) return socket.emit("erroJogo", "Sua resposta já foi registrada.");

        sala.respostas.set(socket.id, indice);
        socket.emit("respostaRegistrada");
        atualizarSala(codigo);

        if ([...sala.jogadores.keys()].every(id => sala.respostas.has(id))) {
            revelarResultado(codigo);
        }
    });

    socket.on("proximaRodada", codigoRecebido => {
        const codigo = String(codigoRecebido || "").toUpperCase();
        const sala = salas.get(codigo);

        if (!sala) return socket.emit("erroJogo", "Sala não encontrada.");
        if (socket.id !== sala.anfitriao) return socket.emit("erroJogo", "Somente o anfitrião pode avançar a rodada.");
        if (!sala.iniciada || !sala.resultadoDisponivel || sala.partidaFinalizada) {
            return socket.emit("erroJogo", "A próxima rodada ainda não pode começar.");
        }

        sala.rodadaAtual += 1;
        sala.resultadoDisponivel = false;
        sala.respostas.clear();
        atualizarSala(codigo);
        enviarDesafio(codigo);
    });

    socket.on("disconnect", () => {
        for (const codigo of salas.keys()) sairDaSala(socket, codigo);
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Simulador Empresarial rodando na porta 3000");
});

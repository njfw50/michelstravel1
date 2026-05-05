import fs from 'fs';

const path = 'c:/Users/njfw2/michelstravel1/client/src/locales/pt.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Add missing trips status
if (data.trips) {
    data.trips.status = {
        "pending": "Pendente",
        "confirmed": "Confirmado",
        "cancelled": "Cancelado",
        "test": "Ambiente de Teste"
    };
}

// Add name_coach_dialog
data.name_coach_dialog = {
    "badge": "Consultoria de Nomes",
    "title_suggest": "Sugestão de Ajuste",
    "title_confirm": "Confirmar Nome",
    "desc_suggest": "Para evitar problemas no embarque, sugerimos uma pequena correção na formatação do seu nome.",
    "desc_confirm": "Por favor, confirme se o nome abaixo está exatamente como no seu documento oficial.",
    "board_title": "Quadro de Consultoria",
    "field_label": "Campo",
    "wrote_label": "Como você escreveu",
    "suggest_label": "Sugestão Michels",
    "full_name_label": "Nome Completo no Bilhete",
    "question_suggest": "Deseja aplicar esta correção?",
    "question_confirm": "O nome está correto?",
    "note": "Nota: O nome no bilhete deve ser idêntico ao do passaporte ou documento de identidade.",
    "primary_suggest": "Aplicar Sugestão",
    "secondary_suggest": "Manter Original",
    "primary_confirm": "Sim, está correto",
    "secondary_confirm": "Não, quero editar",
    "reason_characters": "Identificamos caracteres que podem não ser aceitos pelos sistemas das companhias aéreas.",
    "reason_spacing": "Ajustamos o espaçamento para seguir o padrão internacional de aviação.",
    "reason_case": "Corrigimos as letras maiúsculas para garantir a leitura correta no check-in."
};

// Add profile missing keys
if (data.profile) {
    Object.assign(data.profile, {
        "member_since": "Membro desde",
        "total_trips": "Total de Viagens",
        "unnamed": "Viajante sem nome",
        "view_trips": "Ver minhas viagens",
        "saved": "Salvo",
        "saved_title": "Alterações Salvas",
        "saved_desc": "Suas informações foram atualizadas no nosso sistema blindado.",
        "error_title": "Ops, algo deu errado",
        "error_desc": "Não conseguimos salvar suas alterações agora. Tente novamente em instantes.",
        "secure_login": "Acesso Seguro Ativo",
        "secure_login_desc": "Sua sessão está protegida com criptografia de ponta a ponta.",
        "data_protected": "Dados Protegidos",
        "data_protected_desc": "Suas informações seguem os mais rígidos padrões de privacidade e segurança.",
        "security_title": "Segurança da Conta",
        "login_required": "Login Necessário",
        "login_required_desc": "Você precisa estar logado para acessar esta página."
    });
}

// Add scan
data.scan = {
    "title": "Escanear Documento",
    "subtitle": "Use sua câmera para capturar os dados do documento automaticamente.",
    "back": "Voltar",
    "hint_hold_still": "Segure firme e alinhe o documento",
    "hint_enhancing": "Melhorando a nitidez da imagem...",
    "mobile_timeout": "Tempo esgotado. Tente novamente ou preencha manualmente.",
    "open_camera": "Abrir Câmera",
    "sending_result": "Enviando para análise...",
    "step_finalizing": "Finalizando processamento..."
};

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('pt.json fixed successfully');

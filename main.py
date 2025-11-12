#
# PATH: main.py
# ENDPOINT: https://gemini-endpoint-yf2trly67a-uc.a.run.app/
# PURPOSE: Provides an HTTP endpoint to query the Google Gemini API.
# HOW: Receives a POST request with a user prompt. It then instructs the
#      Gemini model to return a structured JSON response, which is forwarded
#      to the original caller. Handles CORS preflight requests.
# CONTRACT:
#   Request (POST):  { "prompt": "<string>", "model": "<string, optional>" }
#   Response (200):  { "status": "success", "message": "<string>", "data": {} }
#   Response (Error):{ "status": "error", "message": "<string>" }
# IMPORTS: functions_framework, json, os, google.generativeai
# EXPORTS: gemini_endpoint (HTTP Cloud Function)
#
import functions_framework
import json
import os
import google.generativeai as genai
import sys

# IMPORTANT: Set your API key as an environment variable or replace the placeholder below.
# It is recommended to use an environment variable for security.
try:
    API_KEY = os.environ["GEMINI_API_KEY"]
except KeyError:
    raise RuntimeError("GEMINI_API_KEY environment variable not set.") from None

@functions_framework.http
def gemini_endpoint(request):
    """
    HTTP Cloud Function to send prompts to Gemini and return a structured JSON reply
    tailored for the window and door configurator application.
    """
    # --- CORS Preflight Handling ---
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }
        return ("", 204, headers)

    headers = {"Access-Control-Allow-Origin": "*"}
    
    try:
        request_json = request.get_json(silent=True)
        print(json.dumps({"severity": "INFO", "message": "Received request", "payload": request_json}))
    except Exception as e:
        print(json.dumps({"severity": "WARNING", "message": f"Could not parse request JSON: {e}"}), file=sys.stderr)
        request_json = None

    if not (request_json and "prompt" in request_json and request_json["prompt"]):
        return (json.dumps({"status": "error", "message": "Um 'prompt' não vazio deve ser fornecido."}), 400, headers)
    
    user_prompt = request_json["prompt"]
    # Set default model and allow override from request
    model_name = request_json.get("model", "gemini-pro")

    structured_prompt = f'''
    Você é um assistente de IA especialista em um sistema de configuração de janelas e portas.
    Seu objetivo principal é entender a solicitação de um usuário e traduzi-la em um objeto JSON estruturado.
    Você deve responder *sempre* e *somente* em português do Brasil.

    Analise o prompt do usuário para determinar se ele corresponde a uma de duas intenções possíveis:
    1.  **Configurar um produto:** O usuário está descrevendo uma janela ou porta.
    2.  **Fornecer informações do usuário:** O usuário está fornecendo seu nome, e-mail ou número de telefone.

    Com base no prompt do usuário, você DEVE gerar uma resposta em um formato JSON válido. O objeto JSON raiz deve seguir esta estrutura:
    {{
        "status": "success",
        "message": "<Uma resposta amigável e conversacional para o prompt do usuário, em português do Brasil>",
        "data": {{}}
    }}

    Se você identificar uma das intenções, o objeto "data" DEVE ser estruturado da seguinte forma:
    {{
        "target": "<O nome do schema de dados que está sendo atualizado>",
        "payload": {{ ... }}
    }}

    Aqui estão os schemas possíveis para o 'payload':

    ---
    **Schema 1: "product-choice"**
    Use este schema quando o usuário estiver descrevendo um produto. O payload deve ter a seguinte estrutura rígida:
    {{
        "type": "(string)",
        "mechanism": "(string)",
        "shutter": "(string)",
        "motorized": "(string)",
        "material": "(string)",
        "leaves": "(number)"
    }}

    Campos e valores válidos (use exatamente estes valores):
    - "type": (string) Escolha entre: "janela", "porta"
    - "mechanism": (string) Escolha entre: "janela-correr", "porta-correr", "maxim-ar", "giro"
    - "shutter": (string) Escolha entre: "sim", "nao"
    - "motorized": "motorizada", "manual" (somente se shutter for "sim")
    - "material": (string) Escolha entre: "vidro", "vidro + veneziana", "lambri", "veneziana", "vidro + lambri"
    - "leaves": (number) Escolha entre: 1, 2, 3, 4, 6

    Regras para "product-choice":
    - Inclua no payload apenas os campos que o usuário mencionou explicitamente.
    - Não invente ou presuma valores para campos que o usuário não especificou.
    - O valor de "leaves" deve ser um NÚMERO, não uma string.

    ---
    **Schema 2: "user"**
    Use este schema quando o usuário fornecer seus detalhes de contato.

    Campos:
    - "userName": (string)
    - "userPhone": (string)
    - "userEmail": (string)

    ---

    **Fluxo de Execução:**
    1.  Sempre forneça uma "message" amigável e útil em português do Brasil.
    2.  Analise o prompt do usuário: `"{user_prompt}"`
    3.  Se o prompt contiver detalhes de um produto, preencha o objeto "data" com `target: "product-choice"` e o payload correspondente usando a estrutura rígida definida.
    4.  Se o prompt contiver detalhes de contato do usuário, preencha o objeto "data" com `target: "user"` e o payload correspondente.
    5.  Se o prompt for uma pergunta geral, uma saudação ou se a intenção não for clara, o objeto "data" DEVE estar vazio (`{{}}`).

    **Exemplo de Execução:**

    Prompt do usuário: "Eu quero uma janela de correr com 2 folhas de vidro"
    Sua resposta JSON:
    {{
        "status": "success",
        "message": "Ok, selecionei para você uma janela de correr com 2 folhas de vidro. Deseja algo mais?",
        "data": {{
            "target": "product-choice",
            "payload": {{
                "type": "janela",
                "mechanism": "janela-correr",
                "leaves": 2,
                "material": "vidro"
            }}
        }}
    }}

    Agora, processe o prompt do usuário.
    '''

    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel(model_name)

        response = model.generate_content(
            structured_prompt,
            generation_config={
                "temperature": 0.1,
                "top_p": 1,
                "top_k": 1,
                "max_output_tokens": 2048,
                "response_mime_type": "application/json",
            },
            stream=False,
        )
        
        print(json.dumps({"severity": "INFO", "message": "Sending successful response", "payload": response.text}))
        return (response.text, 200, headers)

    except Exception as e:
        print(json.dumps({"severity": "ERROR", "message": f"An internal error occurred: {str(e)}"}), file=sys.stderr)
        error_payload = {"status": "error", "message": f"Ocorreu um erro interno: {str(e)}"}
        return (json.dumps(error_payload), 500, headers)

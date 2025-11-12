# PATH: main.py
# ENDPOINT: https://gemini-endpoint-yf2trly67a-uc.a.run.app/
# PURPOSE: Provides an HTTP endpoint to query the Google Gemini API.
# HOW: Receives a POST request with a user prompt and the current application state.
#       It then instructs the Gemini model to return a strict, structured JSON
#      response which is forwarded to the original caller. Handles CORS.
#
import functions_framework
import json
import os
import google.generativeai as genai
import sys
import yaml

try:
    API_KEY = os.environ["GEMINI_API_KEY"]
except KeyError:
    raise RuntimeError("GEMINI_API_KEY environment variable not set.") from None

try:
    with open('kb.yaml', 'r', encoding='utf-8') as f:
        knowledge_base = yaml.safe_load(f)
    KB_CONTENT = json.dumps(knowledge_base, indent=2, ensure_ascii=False)
except Exception as e:
    print(json.dumps({"severity": "ERROR", "message": f"Could not load knowledge base: {e}"}), file=sys.stderr)
    KB_CONTENT = "{}"

@functions_framework.http
def gemini_endpoint(request):
    """
    HTTP Cloud Function to send prompts and current state to Gemini and return a
    structured, non-destructive JSON reply for the configurator application.
    """
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
        if not request_json:
            raise ValueError("Invalid JSON")
    except Exception as e:
        return (json.dumps({"status": "error", "message": "Malformed JSON in request."}), 400, headers)

    if not (request_json and "prompt" in request_json and request_json["prompt"]):
        return (json.dumps({"status": "error", "message": "A non-empty 'prompt' must be provided."}), 400, headers)

    user_prompt = request_json["prompt"]
    product_choice = request_json.get("productChoice", {})
    model_name = request_json.get("model", "gemini-2.5-flash")

    current_selection_json = json.dumps(product_choice, ensure_ascii=False) if product_choice else "Nenhuma seleção foi feita."

    # <-- MUDANÇA AQUI: O prompt foi atualizado com as novas regras -->
    structured_prompt = f"""
    Você é um assistente de IA especialista em um sistema de configurador de produtos.

    **Regra Absoluta:** Sua resposta DEVE ser um único e válido objeto JSON.

    **Missão:**
    1.  Analise o "PROMPT DO USUÁRIO" e a "SELEÇÃO ATUAL".
    2.  Use a "BASE DE CONHECIMENTO" para responder perguntas. Se a resposta não estiver lá, diga que não sabe.
    3.  Determine se o usuário quer comprar ou falar com um humano (gatilhos: preço, comprar, atendente, etc.).
    4.  Extraia novas características do produto que o usuário mencionou no prompt, **respeitando estritamente os "Valores Válidos" abaixo**.
    5.  Gere uma mensagem amigável em português.
    6.  Construa o objeto JSON de resposta final seguindo o schema obrigatório.

    **Contexto:**
    - **PROMPT DO USUÁRIO:** "{user_prompt}"
    - **SELEÇÃO ATUAL:** {current_selection_json}

    **BASE DE CONHECIMENTO:**
    ```json
    {KB_CONTENT}
    ```

    **Valores Válidos para o Payload (data.payload):**
    Ao extrair características, use APENAS os seguintes valores. Se um valor não corresponder, não o inclua.
    Se o usuário disser "com motor", use "motorizada". Se disser "sem motor", use "manual".
    ```
    categoria: "janela" | "porta";
    sistema: "janela-correr" | "porta-correr" | "maxim-ar" | "giro";
    persiana: "sim" | "nao";
    persianaMotorizada: "motorizada" | "manual" | null; (só preencha se persiana for "sim")
    material: "vidro" | "vidro + veneziana" | "lambri" | "veneziana" | "vidro + lambri";
    folhas: 1 | 2 | 3 | 4 | 6;
    ```
    ---
    **SCHEMA OBRIGATÓRIO PARA A RESPOSTA JSON:**

    ```json
    {{
      "status": "success",
      "message": "(string, sua mensagem para o usuário)",
      "data": {{
        "target": "(string, 'product-choice' ou 'user')",
        "payload": {{
          // Se target for 'product-choice', preencha com os campos extraídos.
          // Ex: "categoria": "janela", "sistema": "correr"
          // Respeite ESTRITAMENTE os "Valores Válidos".
        }},
        // OU, se o usuário quer falar com um humano:
        "talkToHuman": true
      }}
    }}
    ```

    **Instruções para o Schema:**
    1.  **`message`**: Crie uma mensagem amigável. Se o usuário já escolheu "janela", não pergunte se é janela ou porta. Use o contexto!
    2.  **`data.target`**: Use "product-choice" se o usuário descreveu uma característica do produto. Use "user" se ele informou dados pessoais.
    3.  **`data.payload`**: Contenha APENAS as novas características do produto mencionadas no *prompt atual* e que sigam os "Valores Válidos". Não repita o que já está na "SELEÇÃO ATUAL".
    4.  **`data.talkToHuman`**: Use `true` se a intenção de falar com um humano for detectada. Se `talkToHuman` for `true`, o `target` e `payload` podem ser omitidos.

    **Exemplo:**
    - PROMPT DO USUÁRIO: "correr"
    - SELEÇÃO ATUAL: {{"productChoice": {{"categoria": "janela"}}}}
    - SUA RESPOSTA JSON:
    ```json
    {{
      "status": "success",
      "message": "Entendi, uma janela de correr. Qual será o material?",
      "data": {{
        "target": "product-choice",
        "payload": {{
          "sistema": "janela-correr" 
        }}
      }}
    }}
    ```
    Agora, processe o pedido e gere o JSON.
    """

    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel(model_name)

        response = model.generate_content(
            structured_prompt,
            generation_config={
                "temperature": 0.0,
                "response_mime_type": "application/json",
            },
            stream=False,
        )

        try:
            # Valida se o modelo realmente retornou um JSON
            json.loads(response.text)
        except json.JSONDecodeError:
            # Se não for JSON, lança um erro para ser pego abaixo
            raise ValueError("Model returned invalid JSON.")

        return (response.text, 200, headers)

    except Exception as e:
        error_payload = {"status": "error", "message": f"An internal error occurred: {str(e)}"}
        return (json.dumps(error_payload), 500, headers)
# PATH: main.py
# ENDPOINT: https://gemini-endpoint-yf2trly67a-uc.a.run.app/
# PURPOSE: Provides an HTTP endpoint to query the Google Gemini API.
# HOW: Receives a POST request with a user prompt and the current application state.
# 	   It then instructs the Gemini model to return a strict, structured JSON
# 	 response which is forwarded to the original caller. Handles CORS.
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
	# Garante que o KB_CONTENT seja um string JSON, não um objeto Python
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

	# 1. Extrair todos os dados do request
	user_prompt = request_json["prompt"]
	product_choice = request_json.get("productChoice", {})
	user_data = request_json.get("userData", {})
	model_name = request_json.get("model", "gemini-2.5-flash")

	current_selection_json = json.dumps(product_choice, ensure_ascii=False) if product_choice else "Nenhuma seleção foi feita."
	current_user_data_json = json.dumps(user_data, ensure_ascii=False) if user_data else "{}"

	# 2. Construir o prompt em partes para evitar o SyntaxError do f-string
	
	# Parte 1: O início do prompt (como f-string para injetar variáveis)
	prompt_start = f"""
	Você é um assistente de IA especialista em um sistema de configurador de produtos e coleta de leads.

	**Regra Absoluta:** Sua resposta DEVE ser um único e válido objeto JSON.

	**Missão Principal (Prioridade 1): Fluxo de Handoff (Coleta de Dados)**
	Verifique o `CONTEXTO DO USUÁRIO.talkToHuman`.
	1.  **SE `talkToHuman` for `true`:**
		- Sua missão é **COLETAR DADOS**. O usuário está em um fluxo para falar com um humano.
		- Analise o `PROMPT DO USUÁRIO` para extrair `userName`, `userPhone`, ou `userEmail`.
		- Responda com `target: "user-data"` e o `payload` contendo o dado extraído.
		- Ex: `payload: {{"userName": "João Silva"}}`
		- Ex: `payload: {{"userPhone": "555-1234"}}`
		- *Não* tente configurar produtos (Missão 2) se `talkToHuman` for `true`.

	**Missão Secundária (Prioridade 2): Detecção de Handoff**
	Verifique o `PROMPT DO USUÁRIO` para gatilhos de handoff.
	1.  **Gatilhos:** "preço", "quanto custa", "comprar", "negociar", "desconto", "falar com humano", "atendente", "especialista", "pessoa".
	2.  **SE** um gatilho for detectado E `CONTEXTO DO USUÁRIO.talkToHuman` for `false`:
		- Sua missão é **INICIAR O HANDOFF**.
		- Gere uma mensagem amigável (ex: "Claro, para preços, vou te conectar com um especialista...").
		- Responda com `target: "user-data"` e `payload: {{"talkToHuman": true}}`.
		- *Não* tente configurar produtos (Missão 3) se um gatilho for detectado.

	**Missão Padrão (Prioridade 3): Configuração de Produto**
	1.  **SE** `talkToHuman` for `false` E NENHUM gatilho de handoff for detectado:
		- Sua missão é **CONFIGURAR PRODUTO**.
		- Use a "BASE DE CONHECIMENTO" para responder perguntas. Se a resposta não estiver lá, diga que não sabe.
		- Extraia características do produto do `PROMPT DO USUÁRIO` (respeitando os "Valores Válidos").
		- Responda com `target: "product-choice"` e o `payload` contendo as características.

	**Contexto Atual:**
	- **PROMPT DO USUÁRIO:** "{user_prompt}"
	- **SELEÇÃO ATUAL (Produto):** {current_selection_json}
	- **CONTEXTO DO USUÁRIO (Lead):** {current_user_data_json}

	**BASE DE CONHECIMENTO (para Missão 3):**
	```json
	"""
	
	# Parte 2: O fim do prompt (como string regular, sem 'f', para evitar problemas com chaves '{{}}')
	prompt_end = """
	```

	Valores Válidos (para Missão 3 - `product-choice`):
	Use APENAS os seguintes valores. Se um valor não corresponder, não o inclua.
	Se o usuário disser "com motor", use "motorizada". Se disser "sem motor", use "manual".
	```
	categoria: "janela" | "porta";
	sistema: "janela-correr" | "porta-correr" | "maxim-ar" | "giro";
	persiana: "sim" | "nao";
	persianaMotorizada: "motorizada" | "manual" | null; (só preencha se persiana for "sim")
	material: "vidro" | "vidro + veneziana" | "lambri" | "veneziana" | "vidro + lambri";
	folhas: 1 | 2 | 3 | 4 | 6;
	```
	
	Valores Válidos (para Missão 1 - `user-data`):
	```
	userName: (string)
	userPhone: (string)
	userEmail: (string)
	talkToHuman: true | false
	```
	---
	**SCHEMA OBRIGATÓRIO PARA A RESPOSTA JSON:**
	(Sua resposta DEVE seguir este schema)

	```json
	{
	  "status": "success",
	  "message": "(string, sua mensagem amigável em português para o usuário)",
	  "data": {
		"target": "(string, 'product-choice' OU 'user-data')",
		"payload": {
		  // Preencha este objeto com os valores válidos da missão que você executou.
		  // Ex (Missão 3): "categoria": "janela"
		  // Ex (Missão 2): "talkToHuman": true
		  // Ex (Missão 1): "userName": "João Silva"
		}
	  }
	}
	```
	---
	Agora, processe o pedido e gere o JSON.
	"""

	# 3. Juntar as partes para formar o prompt final
	# Isso evita que aspas triplas (ou chaves) no KB_CONTENT quebrem o f-string
	structured_prompt = prompt_start + KB_CONTENT + prompt_end

	# 4. Chamar a API Gemini
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
			# Validar se a resposta é um JSON válido antes de retornar
			json.loads(response.text)
			return (response.text, 200, headers)
		except json.JSONDecodeError:
			raise ValueError(f"Model returned invalid (non-JSON) text: {response.text}")

	except Exception as e:
		error_payload = {"status": "error", "message": f"An internal error occurred: {str(e)}"}
		return (json.dumps(error_payload), 500, headers)
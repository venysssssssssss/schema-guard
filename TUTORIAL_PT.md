# 🛡️ Guia Oficial do Schema Guard (MVP)

Bem-vindo ao **Schema Guard**. Este tutorial vai te guiar de forma visual e prática pelo fluxo de garantir a qualidade dos seus dados.

---

## 🚀 1. Preparando o Terreno

Antes de começar, certifique-se de que seus terminais estão rodando e você gerou os dados de teste.

1.  **Gere os dados de exemplo** (Se ainda não fez):
    ```bash
    bash setup_data.sh
    ```
    *Isso cria `sample_clean.csv` e `sample_dirty.csv` na pasta raiz.*

2.  **Verifique se o sistema está online**:
    *   Frontend: Abra `http://localhost:5173` no navegador.
    *   Backend: Deve estar rodando na porta 8000.

---

## 📝 2. O Cenário (Story Mode)

Imagine que você trabalha na **Prefeitura**.
*   Você espera receber dados de compras seguindo um padrão estrito (**Schema**).
*   O "Município A" manda os dados certinhos.
*   O "Município B" manda tudo bagunçado (colunas renomeadas, formatos errados).

**Seu objetivo:** Aceitar os dados do Município A e corrigir automaticamente os dados do Município B.

---

## 🛠️ Passo 1: Criando a Lei (Registrar Schema)

Vamos definir como os dados **devem** ser.

1.  No Frontend, olhe para a coluna da esquerda: **"1. Register Schema"**.
2.  Preencha os campos:
    *   **Schema Name:** `compras_v1`
    *   **Description:** `Padrão de compras públicas`
    *   **JSON Schema Spec:** (Copie e cole o JSON abaixo)

```json
{
  "type": "object",
  "properties": {
    "purchase_id": { "type": "string" },
    "purchase_date": { "type": "string", "format": "date" },
    "supplier_cnpj": { "type": "string" },
    "supplier_name": { "type": "string" },
    "amount": { "type": "number" },
    "municipality_code": { "type": "string" },
    "contract_status": { "type": "string" }
  },
  "required": ["purchase_id", "supplier_name", "amount"]
}
```

3.  Clique no botão azul **"Register / Update Version"**.
    *   *Visual:* Você verá um alerta "Schema registered!" e ele aparecerá na lista abaixo.

---

## ✅ Passo 2: O Teste Perfeito (Validar Arquivo Limpo)

Agora vamos testar um arquivo que segue as regras.

1.  Olhe para a coluna da direita: **"2. Validate Data"**.
2.  **Select Schema:** Escolha `compras_v1 (v1)`.
3.  **Upload CSV:** Selecione o arquivo `sample_clean.csv` (na pasta do projeto).
4.  Deixe a caixa "Apply Adapter Mapping" **desmarcada** por enquanto.
5.  Clique no botão verde **"Validate File"**.

**Resultado Esperado:**
Uma caixa **VERDE** aparecerá dizendo **"✓ Valid Payload"**. Sucesso!

---

## ❌ Passo 3: O Problema (Validar Arquivo Sujo)

Agora chega o arquivo do "Município B" todo bagunçado.

1.  Ainda na direita, mude o arquivo.
2.  **Upload CSV:** Selecione `sample_dirty.csv`.
3.  Clique em **"Validate File"**.

**Resultado Esperado:**
Uma caixa **VERMELHA** aparecerá: **"✗ Validation Failed"**.
*   *Observe os erros:* Ele vai reclamar que `amount` e `supplier_name` são obrigatórios, mas não foram encontrados (porque no arquivo vieram como `valor_total` e `nome_fornecedor`).

---

## 🔧 Passo 4: O Tradutor (Criar Mapping)

Não vamos pedir para o Município B refazer o arquivo. Vamos criar um adaptador!

1.  Role para baixo na direita: **"3. Define Adapter Mapping"**.
2.  No campo de texto, vamos ensinar o sistema a traduzir os nomes errados para os nomes certos.
3.  Cole este JSON:

```json
{
  "nome_fornecedor": "supplier_name",
  "valor_total": "amount",
  "id_compra": "purchase_id"
}
```
*(Lê-se: "Quando encontrar 'nome_fornecedor', trate como 'supplier_name'")*

4.  Clique no botão roxo **"Save Mapping for compras_v1"**.

---

## ✨ Passo 5: A Mágica (Validar com Mapping)

Agora vamos tentar validar o arquivo sujo de novo, mas usando nosso tradutor.

1.  Volte para a seção de upload (**2. Validate Data**).
2.  Certifique-se de que `sample_dirty.csv` está selecionado.
3.  ☑️ **Marque a caixinha:** `Apply Adapter Mapping (if available)`.
4.  Clique em **"Validate File"**.

**Resultado Esperado:**
A caixa deve ficar **VERDE** (ou ter muito menos erros)!
O sistema leu o arquivo "errado", aplicou suas regras de tradução em tempo real, e validou o resultado final contra o Schema oficial.

---

**Parabéns!** Você acabou de criar um pipeline de Data Quality resiliente. 🎉

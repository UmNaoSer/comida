# Nebula Finanx - Gestão Financeira com IA

Este projeto é um rastreador de finanças moderno que utiliza IA para leitura de notas fiscais e análise de gastos.

## Como subir para um novo repositório no GitHub

Siga estes passos no seu terminal:

1. **Crie um novo repositório vazio** no seu [GitHub](https://github.com/new).
2. **Abra o terminal** na pasta do seu projeto.
3. **Inicialize e conecte o repositório**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Nebula Finanx"
   git branch -M main
   # Substitua a URL abaixo pela URL do seu novo repositório
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

## Variáveis de Ambiente Necessárias (Vercel/Hosting)

Para que as funcionalidades de IA funcionem em produção, configure a seguinte variável no seu painel de deploy:

- `GOOGLE_GENAI_API_KEY`: Sua chave de API do Google Gemini.

## Tecnologias
- Next.js 15 (App Router)
- Firebase (Firestore & Auth)
- Genkit AI (Gemini 2.0 Flash)
- Tailwind CSS & ShadCN UI

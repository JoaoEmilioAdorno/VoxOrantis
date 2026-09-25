# Validação para publicação — 16/09/2026

- `npm run build`: aprovado; aviso de tamanho do pacote JavaScript do globo.
- `npm run lint`: aprovado.
- `git diff --check`: aprovado.
- Migrações locais e remotas do Supabase sincronizadas, incluindo áudio e exclusão de orações publicadas.
- Upload de MP3: aprovado. Leitura pública antes da aprovação e sobrescrita do arquivo foram bloqueadas.
- Revisão, aprovação e disponibilidade pública: aprovadas em teste transacional com rollback.
- Teste no navegador com oração temporária publicada: áudio servido pelo Supabase Storage reproduziu sem erro, junto com o texto revisado no globo.
- Término do áudio: confirmado em 19,07 segundos; texto do globo removido automaticamente.
- Limpeza: oração temporária e os dois arquivos de áudio usados nesta sessão removidos. A remoção dos arquivos exigiu o acesso administrativo existente, pois a exclusão anônima retornou zero objetos.
- Geolocalização: expirou no navegador de teste. O registro de novos pontos no mapa não foi validado nesta sessão.

## Publicação

Artefato de produção gerado em `dist/`, com fallback de rotas em `_redirects`.
Publicado em produção no Netlify em 17/09/2026, após autenticação e nova execução de build e lint.

- Site: https://voxorantis.netlify.app/
- Deploy: `6aab69d3bd2c60b0d38458fa`.
- Registro: https://app.netlify.com/projects/voxorantis/deploys/6aab69d3bd2c60b0d38458fa
- HTTP 200 e HTML público idêntico ao `dist/index.html` validado.
- Interface pública conferida: seleção de orações, biblioteca e formulário com áudio opcional de até 20 MB.
- Publicação direta do pacote local. As alterações de código continuam locais, sem commit/push; o repositório GitHub ainda precisa ser sincronizado antes de uma futura publicação automática por Git.

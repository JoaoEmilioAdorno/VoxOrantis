# Vox Orantis — Escopo atual

Atualizado em 10/09/2026 por decisão do proprietário do projeto.

## Áreas mantidas

- Quem somos, incluindo a apresentação e as doações.
- Capela de Milagres: testemunhos sujeitos à moderação.
- Capela de Orações: pedidos sujeitos à moderação.
- Outras Orações: biblioteca de orações publicadas e botão para adicionar uma nova oração, que só será publicada após aprovação da moderação. O envio aceita áudio opcional de até 20 MB, com prévia no formulário e na moderação. Depois da publicação, o áudio acompanha a oração oferecida no globo.
- Moderação: acesso por e-mail e senha, reservado aos moderadores autorizados.

O globo, o oferecimento de orações por visitantes, os contadores, os áudios e a instalação como PWA continuam disponíveis.

## Simplificação

Comunidades, grupos, membros, perfis, cadastro público, login social, agenda comunitária e encontros foram retirados do escopo. Não existem papéis de membro, administrador ou proprietário no aplicativo; o acesso restrito usa somente a tabela de moderadores.

A migração 20260910220000_remove_communities_and_members.sql remove as estruturas comunitárias e preserva as orações, os pedidos, os testemunhos, as sugestões existentes e os moderadores. As migrações anteriores permanecem como histórico do banco, não como funcionalidades ativas.

## Publicação

Validar a versão local antes de publicar no Netlify.


## Terços e novenas — 24/09/2026

Outras Orações inclui as subdivisões Terços e Novenas, preservando as orações avulsas.
Os cadastros seguem o fluxo de sugestão, revisão e publicação existente. Terços permitem
configurar etapas, leitura de mistérios, ordem das orações, repetições por oração e por
sequência. O exemplo Terço a Maria usa os mistérios gozosos e a ordem solicitada:
Creio, três Ave-Marias e Glória; cada dezena começa com o mistério, Pai-Nosso,
Glória e dez Ave-Marias. Novenas permitem cadastrar de 1 a 31 dias, com textos e
orações próprios para cada dia. A quantidade é configurável, com nove dias iniciais.

O leitor de novenas não salva dias rezados nem identifica o visitante. “Dias restantes”
é apenas total de dias menos a posição escolhida; não representa histórico. Estado
de leitura e rascunhos existem somente na memória da tela. No envio de roteiros,
o identificador exigido pelo RPC de sugestões é efêmero, sem localStorage.

Os roteiros são armazenados no campo text já existente das sugestões, como documento
JSON com prefixo versionado VOX-DEVOTION/1. A migração de áudios individuais adiciona
ao registro a lista privada de caminhos dos arquivos associados ao roteiro.
A revisão usa editor estruturado e validação; o leitor não exibe o JSON ao visitante.
Permanece o limite existente de 5.000 caracteres por sugestão (estrutura incluída).
Orações prontas são referenciadas por ID para evitar duplicação. Os roteiros não
entram na seleção do globo. Conteúdo inválido não é carregado como roteiro.

Terços e novenas aceitam um áudio individual opcional em cada oração, nos mesmos
formatos e limite de 20 MB por arquivo das orações avulsas. Os arquivos permanecem
privados até a aprovação. No leitor, cada oração tem seu próprio botão “Oferecer”.
Cada toque usa o fluxo existente de localização e registro, soma uma oração, cria a
luz no globo e mostra somente o texto e o áudio selecionados. A leitura do mistério
não é oferecida. O ato de oferecer não cria acompanhamento do progresso do roteiro.

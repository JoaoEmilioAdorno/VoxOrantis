# Vox Orantis — Permissões atuais

| Ação | Visitante | Moderador autenticado |
|---|---|---|
| Ver Quem somos, capelas, biblioteca e globo | Sim | Sim |
| Oferecer oração | Sim | Sim |
| Enviar pedido ou testemunho para revisão | Sim | Sim |
| Enviar nova oração para revisão | Sim | Sim |
| Ler conteúdo pendente | Não | Sim |
| Aprovar ou rejeitar conteúdo | Não | Sim |
| Revisar e publicar sugestões de orações | Não | Sim |
| Excluir orações publicadas pelo formulário e seus áudios | Não | Sim, com confirmação |

A autenticação usa Supabase Auth. A autorização exige um registro na tabela public.moderators e é verificada no banco por public.can_moderate(), pelas políticas RLS e pelas funções de moderação. Uma sessão autenticada, isoladamente, não concede acesso.

Não há cadastro de membros nem gerenciamento de comunidades. Contas de moderadores são provisionadas administrativamente no Supabase; o aplicativo não oferece cadastro público.


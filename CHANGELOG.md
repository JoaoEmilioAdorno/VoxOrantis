## Commit 4 — Domain Layer

### Adicionado

- Camada repositories criada.
- prayerRepository.js
- statsRepository.js

### Refatorado

- prayerService agora utiliza Repository.
- statsService agora utiliza Repository.
- useStats criado para encapsular carregamento de estatísticas.

### Arquitetura

Fluxo oficial definido:

Component
→ Hook
→ Service
→ Repository
→ Supabase

Nenhum componente React acessa Supabase diretamente.
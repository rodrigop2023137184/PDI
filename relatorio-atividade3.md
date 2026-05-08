# Relatório – Atividade nº 3

**Licenciatura em Informática de Gestão**
**Projeto e Desenvolvimento Informático — 2025/2026**

---

## 1. Identificação do grupo

| Nome | Nº de aluno |
|---|---|
| Rodrigo | a2023137184 |
| Domingos Junior | 2023133444 |

---

## 2. Introdução

A aplicação desenvolvida — **Komikalate** — é uma app móvel de receitas culinárias destinada a utilizadores que pretendam descobrir, filtrar e guardar receitas de acordo com as suas preferências alimentares.

Funcionalidades principais:
- Autenticação (registo, login, recuperação de palavra-passe e verificação de email)
- Pesquisa de receitas por nome
- Filtros por tipo de dieta (vegetariana, vegan, omnívora), tempo de preparação, calorias, alta proteína e baixa gordura
- Ecrã de detalhe da receita com lista de ingredientes e instruções
- Sistema de favoritos por utilizador
- Modo "convidado" para utilização sem conta

---

## 3. Tecnologias utilizadas

**Frontend (mobile):**
- **React Native + Expo (~54)** — framework de desenvolvimento multiplataforma para iOS e Android
- **TypeScript** — tipagem estática para maior robustez do código
- **React Navigation** — navegação entre ecrãs (Native Stack Navigator + Bottom Tabs)
- **API Animated do React Native** — animações de entrada, *floating labels* e *press feedback*
- **Expo Vector Icons** (Ionicons, MaterialCommunityIcons) — biblioteca de ícones
- **AsyncStorage / Expo Secure Store** — persistência local da sessão

**Backend / Base de dados:**
- **Supabase** — *Backend-as-a-Service* que fornece autenticação e base de dados PostgreSQL
- **@supabase/supabase-js** — cliente JavaScript oficial

A escolha do Supabase permitiu-nos focar na lógica da aplicação sem termos de implementar do zero a autenticação, gestão de sessões, permissões e sincronização de dados.

---

## 4. Dificuldades e desvios em relação à 2ª entrega

Todas as funcionalidades previstas para esta entrega foram implementadas. Durante o desenvolvimento foram, no entanto, resolvidas algumas dificuldades técnicas que vale a pena descrever.

### 4.1 Migração da fonte de dados

Numa primeira fase a aplicação consumia receitas de uma API externa (Spoonacular). Decidimos depois migrar para uma base de dados própria no Supabase. Esta decisão deu-nos controlo total sobre os campos (nutrientes, dieta, tempo de preparação, ingredientes) e tornou possível implementar os filtros customizados que de outra forma seriam dependentes do que a API permitisse devolver.

### 4.2 Recuperação de palavra-passe

A recuperação de palavra-passe via email decorre em duas fases:
1. O utilizador pede o *reset* → o Supabase envia um email com um link
2. O utilizador clica no link → deve ser redirecionado para a aplicação para definir uma nova palavra-passe

Inicialmente o link enviado por email não abria a aplicação e levava a uma página em branco. A causa identificada foi a falta de configuração do parâmetro `redirectTo` na chamada `supabase.auth.resetPasswordForEmail()` e a inexistência de um *deep link* (esquema URI próprio) na aplicação.

A solução implementada envolveu:

- Adicionar `"scheme": "komikalate"` no [app.json](app.json), permitindo que a app responda a URLs do tipo `komikalate://...`
- Configurar o cliente Supabase para usar o fluxo **PKCE** (`flowType: 'pkce'` em [lib/supabase.ts](lib/supabase.ts)), recomendado para aplicações móveis
- Passar `redirectTo: 'komikalate://reset-password'` no pedido de *reset* em [LoginScreen.tsx](src/screens/LoginScreen.tsx)
- Implementar um *listener* de deep links no [App.tsx](App.tsx) que extrai o código de recuperação do URL, troca-o por uma sessão válida via `exchangeCodeForSession()` e reage ao evento `PASSWORD_RECOVERY` emitido pelo Supabase
- Criar um ecrã dedicado [RecuperarPasswordScreen.tsx](src/screens/RecuperarPasswordScreen.tsx) onde o utilizador define a nova palavra-passe através de `updateUser({ password })`

**Limitação a ter em conta na avaliação:**
O fluxo de recuperação implementado **só é completamente funcional num *development build*** da aplicação (`npx expo run:android/ios`), **não em Expo Go**. Isto deve-se ao facto de o Expo Go usar o seu próprio esquema URI (`exp://`) e não reconhecer esquemas customizados (`komikalate://`). Toda a lógica está implementada no código — o ecrã de definição da nova palavra-passe, a troca de código por sessão e a atualização da palavra-passe foram validados isoladamente. Para que o link no email abra a aplicação automaticamente, é também necessário adicionar `komikalate://reset-password` à lista de **Redirect URLs** permitidas no dashboard do Supabase (em *Authentication → URL Configuration*).

### 4.3 Verificação de email no registo

O Supabase, por defeito, exige confirmação de email após o registo. O link de confirmação utiliza exatamente o mesmo mecanismo de redirecionamento descrito em 4.2 e, por isso, partilha a mesma limitação em ambiente Expo Go. Para efeitos de avaliação, recomendamos uma destas duas alternativas:

- **(Recomendado)** Desativar temporariamente a opção *Confirm email* no dashboard Supabase em **Authentication → Settings**, permitindo registo e login imediatos durante a avaliação
- Em alternativa, os utilizadores criados durante a avaliação podem ser manualmente confirmados pelo administrador do projeto através do dashboard Supabase

---

## 5. Acesso à aplicação e à base de dados

- **Repositório GitHub:** https://github.com/rodrigop2023137184/PDI
- **Base de dados Supabase:** o projeto está configurado para uma instância partilhada em `auwqpsjngoarexudjxap.supabase.co`. As credenciais (URL e *anon key*) estão presentes em [lib/supabase.ts](lib/supabase.ts) e não requerem configuração adicional.
- **Como executar localmente:**
  ```bash
  npm install
  npx expo start
  ```
  Depois basta ler o código QR com a aplicação **Expo Go** (Android/iOS) ou abrir num emulador.

---

## 6. Conclusão

O desenvolvimento da Komikalate permitiu consolidar competências em React Native, TypeScript e na integração com soluções *Backend-as-a-Service* através do Supabase. Os principais desafios técnicos prenderam-se com fluxos que dependem de redirecionamentos externos (recuperação de palavra-passe e verificação de email), tendo sido resolvidos com a introdução de *deep linking* e do fluxo PKCE.

A aplicação cumpre integralmente os requisitos definidos na 2ª entrega, oferecendo uma experiência fluida de pesquisa, filtragem e gestão de receitas. Como melhorias futuras identificámos: empacotar a aplicação como *development build* para validar *end-to-end* os fluxos de email, otimização da UI em ecrãs maiores (tablet) e suporte a internacionalização.

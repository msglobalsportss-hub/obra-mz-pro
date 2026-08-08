<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## 📜 Regras Permanentes de Arquitetura & UX do ObraMZ

1. **Rede de Navegação Contextual Cruzada**:
   Todas as entidades principais do ObraMZ (Clientes, Obras, Materiais, Compras, Entregas, Fornecedores, Equipas, Armazéns e Pagamentos) devem formar uma rede de navegação contextual. Sempre que uma entidade estiver relacionada com outra, o utilizador deve conseguir navegar diretamente entre elas através de links, botões ou cartões contextuais, sem necessidade de regressar ao menu principal.

2. **Eliminação de Paredes sem Saída**:
   Nenhuma página principal do ObraMZ pode terminar numa "parede sem saída". Sempre que o utilizador visualizar uma entidade (Fornecedor, Compra, Entrega, Material, Obra, Armazém ou Movimento), deve existir um caminho claro para continuar o processo operacional através de entidades relacionadas.

3. **Consistência Operacional & Reatividade Multientidade**:
   Sempre que uma operação modificar o estado do sistema (Compra, Entrega, Receção, Transferência, Consumo ou Ajuste), essa alteração deve refletir-se automaticamente em todas as entidades relacionadas, garantindo consistência visual, contextual e operacional em toda a aplicação.

4. **Sem Duplicação de Dados do Cabeçalho**:
   Nenhum componente contextual pode mostrar informação duplicada que já exista no cabeçalho da página. O objetivo dos painéis contextuais é complementar a informação principal com relações, estado operacional e próximas ações, evitando repetir dados já visíveis.


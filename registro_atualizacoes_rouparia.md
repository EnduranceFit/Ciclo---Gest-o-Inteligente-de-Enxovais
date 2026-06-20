# Registro de Atualizações - Gestão de Rouparia

## Data: 20 de Junho de 2026

### Objetivo
Atualizar a regra de negócio do controle de rouparia para refletir o fluxo operacional real: a roupa suja enviada para a lavanderia em um dia (Hoje) retorna como roupa limpa no dia seguinte (Amanhã).

### Mudanças na Regra de Negócio
- **Anteriormente:** O sistema contabilizava o envio de peças sujas e o recebimento de peças limpas como ocorrendo no mesmo dia.
- **Novo Fluxo ("Enviado Hoje / Recebido Amanhã"):** 
  - O registro de envio (roupa suja) afeta o saldo de itens na lavanderia imediatamente.
  - O recebimento de itens limpos (retorno) é registrado em um novo formulário/dia, correspondendo à devolução do que foi enviado no dia anterior.
  - O cálculo de Saldo no Dashboard passa a considerar a diferença temporal.

### Arquivos Afetados
1. **`src/components/Dashboard.tsx`**
   - Alteração na lógica de cálculo de saldo ("Em Lavanderia") para refletir itens enviados hoje vs. itens recebidos amanhã.
   - Ajuste na exibição das métricas para dar clareza visual ao usuário sobre o status do estoque.

2. **`src/components/DailyForm.tsx`**
   - Ajuste nos campos do formulário para separar o "Envio" (Hoje) do "Recebimento" (referente ao dia anterior).
   - Validações para garantir que a data de recebimento e envio façam sentido cronológico.

### Próximos Passos
- Implementar as alterações nos componentes (`Dashboard.tsx` e `DailyForm.tsx`).
- Realizar testes locais.
- **Efetuar o Deploy da Aplicação.**

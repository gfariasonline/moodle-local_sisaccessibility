# 1.0.0 — 2026-11-06

- Primeira versão estável.
- Componente renomeado de `local_sis_accessibility` para `local_sisaccessibility`
  (pasta `local/sisaccessibility`). **Não há migração**: configurações, preferências
  salvas no navegador e o registro do componente antigo não são aproveitados.
  Desinstale o plugin antigo e reconfigure o novo.
- Posição padrão do botão alterada para centro-direita (desktop e celular).
- O logo SIS/GFARIAS (`pix/sis-logo.png`) é de titularidade de GFARIAS, todos os direitos reservados.

# 0.2.0-dev — 2026-10-16

- Logo SIS local no rodapé, com altura de 44 px e contraste escuro por CSS;
  GFARIAS com link para https://gfarias.com em nova aba.

- Foco/guia de leitura: janela transparente de 60 px com entorno escurecido,
  acompanhamento do ponteiro e do foco do teclado; restauração completa ao redefinir.

- Ícone original do acionador e painel lateral com cartões e grupos, identidade GFARIAS.
- Correção do alcance dos filtros de cor e dos fundos em contraste claro/escuro.
- Quatro predefinições, ocultação de imagens e dicas de texto alternativo.
- Removidos Super foco, Leitor de PDF, Estrutura da página e Leitura por voz,
  incluindo os perfis dependentes e a biblioteca PDF.js.
- Novos recursos implementados no plugin, sem incorporar o pacote Sienna proprietário.
- Atualização das ferramentas padrão preserva seleções administrativas personalizadas.
- Cor padrão azul Sienna (#0848CA) com texto branco (#FFFFFF), substituindo o laranja.
- Posições centro-esquerda (padrão) e centro-direita, no computador e no celular; os cantos continuam válidos.
- Estado alpha; homologação Moodle 4.5–5.3 pendente.

# 0.1.0-dev — 2026-10-16

- Primeira implementação local por Thiago Serrão: integração Moodle, configurações,
  traduções pt_br/en, painel GFARIAS e definições Sienna incorporadas.
- Preferências por sessão, efeitos reversíveis e conteúdo AJAX.
- Fonte OpenDyslexic e ícones locais, sem terceiros em execução.
- Estado alpha; homologação Moodle 4.5–5.3 pendente.

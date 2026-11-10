# 1.1.0 — 2026-11-10

Features adopted after reviewing the UFPel `local_a11y` plugin, reimplemented on this plugin's own tools.

- **Saved adjustments reach the first paint.** A small inline snippet after `<body>` restores this session's saved
  tools as `sis-a11y-pre-*` classes on `<html>`; `styles.css` approximates them until the widget applies the exact
  adjustments and removes the classes. No new data is read, stored or sent. Added the top-of-body output hook and
  `templates/bootstrap.mustache`.
- **Five more profiles:** Dyslexia, Colour blindness, Older adults, Motor difficulty and Night mode (nine in total).
- **Alt+A shortcut** to open and close the panel, with `aria-keyshortcuts` on the launcher. New setting *Keyboard
  shortcut* (on by default); ignored with Ctrl, Meta or Shift, on key repeat, while typing in a field and while a
  Moodle modal is open; focus returns to where the user was.
- **Pause videos and GIFs** and **Mute media** tools: stop playing media and unrequested playback, freeze same-origin
  animated GIFs on their first frame, and keep players muted. Not applicable inside iframes.
- **Protanopia, deuteranopia and tritanopia filters**, built from one set of matrices rendered as a hidden SVG
  (`classes/local/colour_vision.php`). They join the mutually exclusive colour modes.
- Upgrade: an untouched 1.0.0 tool list is extended with the five new tools; customised lists are preserved.
  Version 2026111001.
- Lucide icons added (type, palette, person-standing, hand, moon, circle-pause, volume-x, droplets) from the pinned
  upstream commit, with checksums in `thirdparty/SHA256SUMS`.
- `amd/build` regenerated with Moodle 5.3's Grunt; the unchanged `sienna.min.js` keeps its licence header.

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

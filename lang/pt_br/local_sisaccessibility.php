<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Language strings.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();
$string['animations'] = 'Pausar animações CSS';
$string['bold'] = 'Texto em negrito';
$string['close'] = 'Fechar ferramentas de acessibilidade';
$string['colour'] = 'Cor de fundo do botão';
$string['colour_desc'] = 'Cor hexadecimal com seis dígitos, por exemplo #0848CA. A cor do texto e ícone é ajustada automaticamente para preto ou branco quando necessário para garantir contraste mínimo de 4,5:1.';
$string['colourgroup'] = 'Cores';
$string['contentgroup'] = 'Conteúdo';
$string['cursor'] = 'Cursor ampliado';
$string['darkcontrast'] = 'Contraste escuro';
$string['decrease'] = 'Diminuir tamanho do texto';
$string['deuteranopia'] = 'Filtro de deuteranopia';
$string['dyslexia'] = 'Fonte para dislexia';
$string['enabled'] = 'Ativar SIS Accessibility';
$string['enabled_desc'] = 'Exibir o widget de acessibilidade nas páginas HTML permitidas.';
$string['excludedcourses'] = 'IDs dos cursos excluídos';
$string['excludedcourses_desc'] = 'IDs numéricos positivos separados por vírgulas ou espaços. Deixe vazio para todos os cursos.';
$string['fontsize'] = 'Tamanho do texto';
$string['guide'] = 'Guia de leitura';
$string['headings'] = 'Realçar títulos';
$string['hideimages'] = 'Ocultar imagens';
$string['highcontrast'] = 'Alto contraste';
$string['highsaturation'] = 'Alta saturação';
$string['imagetooltips'] = 'Descrições de imagens';
$string['increase'] = 'Aumentar tamanho do texto';
$string['invalidcourses'] = 'Informe apenas IDs numéricos positivos separados por vírgulas ou espaços.';
$string['invalidnumber'] = 'Informe um número inteiro entre {$a->min} e {$a->max}.';
$string['language'] = 'Idioma';
$string['language_en'] = 'English';
$string['language_pt_br'] = 'Português (Brasil)';
$string['letterspacing'] = 'Espaçamento entre letras';
$string['lightcontrast'] = 'Contraste claro';
$string['lineheight'] = 'Altura de linha';
$string['links'] = 'Realçar links';
$string['lowsaturation'] = 'Baixa saturação';
$string['mobileoffsetx'] = 'Deslocamento horizontal no celular (px)';
$string['mobileoffsety'] = 'Deslocamento vertical no celular (px)';
$string['mobileposition'] = 'Posição no celular';
$string['mobilesize'] = 'Tamanho do botão no celular (px)';
$string['monochrome'] = 'Monocromático';
$string['offset_desc'] = 'Inteiro entre 0 e 200 pixels.';
$string['offsetx'] = 'Deslocamento horizontal no computador (px)';
$string['offsety'] = 'Deslocamento vertical no computador (px)';
$string['open'] = 'Abrir ferramentas de acessibilidade';
$string['pausemedia'] = 'Pausar vídeos e GIFs';
$string['persist'] = 'Salvar ajustes neste navegador';
$string['persist_desc'] = 'Restaurar ajustes somente durante a sessão Moodle atual. Registros inativos podem permanecer no navegador por até 90 dias antes da limpeza; sem continuidade entre sessões nem sincronização de conta.';
$string['pluginname'] = 'SIS Accessibility';
$string['position'] = 'Posição no computador';
$string['position_bottom_left'] = 'Inferior esquerda';
$string['position_bottom_right'] = 'Inferior direita';
$string['position_center_left'] = 'Centro à esquerda';
$string['position_center_right'] = 'Centro à direita';
$string['position_top_left'] = 'Superior esquerda';
$string['position_top_right'] = 'Superior direita';
$string['privacy:metadata:browser'] = 'As preferências de apresentação são armazenadas apenas neste navegador, quando habilitadas, por até 90 dias. Nenhum serviço remoto as recebe. Podem ser removidas com Redefinir ou pelos controles de dados do navegador; o servidor não pode exportar nem apagar remotamente o localStorage, inclusive após desinstalar o plugin.';
$string['privacy:metadata:browser:preferences'] = 'Ferramentas de apresentação selecionadas e escala do texto; sem conteúdo de cursos, nomes, e-mails ou perfis de deficiência.';
$string['privacy:metadata:browser:scope'] = 'Hash da instalação e escopo aleatório da sessão Moodle, sem identificador do usuário.';
$string['privacy:metadata:session'] = 'O Moodle mantém um escopo aleatório transitório e um marcador interno de conta em sua sessão existente. Eles são renovados nas mudanças de autenticação e expiram com a sessão. A exclusão de dados pelo núcleo do Moodle encerra as sessões. As configurações globais do plugin não contêm perfis de acessibilidade.';
$string['privacy:metadata:session:scope'] = 'Escopo aleatório e marcador de conta exclusivo do servidor para separar preferências entre sessões e contas. Nenhum identificador de conta é enviado ao widget.';
$string['profile_adhd_friendly'] = 'Foco';
$string['profile_adhd_friendly_desc'] = 'Guia de leitura e menos distrações para manter a atenção no conteúdo.';
$string['profile_cognitive_learning'] = 'Leitura e aprendizado';
$string['profile_cognitive_learning_desc'] = 'Texto mais fácil de ler, com mais espaçamento, fonte legível e títulos destacados.';
$string['profile_colour_blind'] = 'Daltonismo';
$string['profile_colour_blind_desc'] = 'Filtro de deuteranopia e links destacados, para que a cor não seja a única pista.';
$string['profile_dyslexia'] = 'Dislexia';
$string['profile_dyslexia_desc'] = 'Fonte própria para dislexia, mais espaçamento e guia de leitura.';
$string['profile_motor'] = 'Dificuldade motora';
$string['profile_motor_desc'] = 'Cursor ampliado, links destacados e texto maior, para facilitar encontrar e acertar os alvos.';
$string['profile_night'] = 'Modo noturno';
$string['profile_night_desc'] = 'Contraste escuro para uso com pouca luz.';
$string['profile_seizure_safe'] = 'Menos movimento';
$string['profile_seizure_safe_desc'] = 'Pausa animações e suaviza cores.';
$string['profile_senior'] = 'Pessoas idosas';
$string['profile_senior_desc'] = 'Texto maior e mais forte, com mais altura de linha e cursor ampliado.';
$string['profile_visually_impaired'] = 'Baixa visão';
$string['profile_visually_impaired_desc'] = 'Texto maior, contraste mais forte, cursor ampliado, fonte legível e links destacados.';
$string['profilesgroup'] = 'Perfis';
$string['protanopia'] = 'Filtro de protanopia';
$string['reset'] = 'Redefinir ajustes';
$string['shortcut'] = 'Atalho de teclado';
$string['shortcut_desc'] = 'Abre e fecha o painel com Alt+A. Desative se o atalho conflitar com um leitor de tela ou um comando do navegador.';
$string['shortcut_hint'] = 'Atalho de teclado: Alt+A';
$string['showadmin'] = 'Exibir na administração';
$string['showadmin_desc'] = 'Incluir páginas de administração do site.';
$string['showlogin'] = 'Exibir nas páginas de autenticação';
$string['showlogin_desc'] = 'Incluir login, cadastro e recuperação de senha.';
$string['silencemedia'] = 'Silenciar mídia';
$string['size'] = 'Tamanho do botão no computador (px)';
$string['size_desc'] = 'Inteiro entre 48 e 96 pixels.';
$string['status'] = 'Tamanho do texto';
$string['textcolour'] = 'Cor do texto e ícone do botão';
$string['title'] = 'Acessibilidade';
$string['tools'] = 'Ferramentas disponíveis';
$string['tools_desc'] = 'Desmarque todas para ocultar o widget e seus efeitos.';
$string['toolsgroup'] = 'Ferramentas';
$string['tritanopia'] = 'Filtro de tritanopia';
$string['visualgroup'] = 'Ajustes visuais';

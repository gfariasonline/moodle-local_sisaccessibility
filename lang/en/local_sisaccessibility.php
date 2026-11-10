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
$string['animations'] = 'Pause CSS animations';
$string['bold'] = 'Bold text';
$string['close'] = 'Close accessibility tools';
$string['colour'] = 'Button background colour';
$string['colour_desc'] = 'Six-digit hexadecimal colour, for example #0848CA. Text and icon colour is automatically adjusted to black or white if needed for a contrast ratio of at least 4.5:1.';
$string['colourgroup'] = 'Colours';
$string['contentgroup'] = 'Content';
$string['cursor'] = 'Large cursor';
$string['darkcontrast'] = 'Dark contrast';
$string['decrease'] = 'Decrease text size';
$string['deuteranopia'] = 'Deuteranopia filter';
$string['dyslexia'] = 'Dyslexia font';
$string['enabled'] = 'Enable SIS Accessibility';
$string['enabled_desc'] = 'Show the accessibility widget on eligible HTML pages.';
$string['excludedcourses'] = 'Excluded course IDs';
$string['excludedcourses_desc'] = 'Positive numeric course IDs separated by commas or whitespace. Leave empty for all courses.';
$string['fontsize'] = 'Text size';
$string['guide'] = 'Reading guide';
$string['headings'] = 'Highlight headings';
$string['hideimages'] = 'Hide images';
$string['highcontrast'] = 'High contrast';
$string['highsaturation'] = 'High saturation';
$string['imagetooltips'] = 'Image tooltips';
$string['increase'] = 'Increase text size';
$string['invalidcourses'] = 'Enter only positive numeric course IDs separated by commas or whitespace.';
$string['invalidnumber'] = 'Enter an integer between {$a->min} and {$a->max}.';
$string['language'] = 'Language';
$string['language_en'] = 'English';
$string['language_pt_br'] = 'Português (Brasil)';
$string['letterspacing'] = 'Letter spacing';
$string['lightcontrast'] = 'Light contrast';
$string['lineheight'] = 'Line height';
$string['links'] = 'Highlight links';
$string['lowsaturation'] = 'Low saturation';
$string['mobileoffsetx'] = 'Mobile horizontal offset (px)';
$string['mobileoffsety'] = 'Mobile vertical offset (px)';
$string['mobileposition'] = 'Mobile position';
$string['mobilesize'] = 'Mobile button size (px)';
$string['monochrome'] = 'Monochrome';
$string['offset_desc'] = 'Integer between 0 and 200 pixels.';
$string['offsetx'] = 'Desktop horizontal offset (px)';
$string['offsety'] = 'Desktop vertical offset (px)';
$string['open'] = 'Open accessibility tools';
$string['pausemedia'] = 'Pause videos and GIFs';
$string['persist'] = 'Save adjustments in this browser';
$string['persist_desc'] = 'Continue saved adjustments only within the current Moodle session. Inactive browser entries may remain for up to 90 days before cleanup; no continuity between sessions or account synchronisation.';
$string['pluginname'] = 'SIS Accessibility';
$string['position'] = 'Desktop position';
$string['position_bottom_left'] = 'Bottom left';
$string['position_bottom_right'] = 'Bottom right';
$string['position_center_left'] = 'Center left';
$string['position_center_right'] = 'Center right';
$string['position_top_left'] = 'Top left';
$string['position_top_right'] = 'Top right';
$string['privacy:metadata:browser'] = 'Presentation preferences are stored only in this browser, when enabled, for up to 90 days. No remote service receives them. They can be removed with Reset or browser site-data controls; the server cannot export or remotely erase localStorage, including after uninstallation.';
$string['privacy:metadata:browser:preferences'] = 'Selected presentation tools and text scale; no course content, names, email addresses or disability profiles.';
$string['privacy:metadata:browser:scope'] = 'An installation hash and a random Moodle-session scope, without a user identifier.';
$string['privacy:metadata:session'] = 'Moodle keeps a transient random scope and an internal account marker in its existing session. They rotate on authentication changes and expire with that session. Core user privacy deletion destroys Moodle sessions. Global plugin settings contain no accessibility profiles.';
$string['privacy:metadata:session:scope'] = 'Random scope and server-only account marker used to separate browser preferences between sessions and accounts. No account identifier is sent to the widget.';
$string['profile_adhd_friendly'] = 'Focus';
$string['profile_adhd_friendly_desc'] = 'Reading guide and fewer distractions to stay on the content.';
$string['profile_cognitive_learning'] = 'Reading and learning';
$string['profile_cognitive_learning_desc'] = 'Easier-to-read text with more spacing, a readable font and highlighted headings.';
$string['profile_colour_blind'] = 'Colour blindness';
$string['profile_colour_blind_desc'] = 'Deuteranopia colour filter and highlighted links, so colour is not the only cue.';
$string['profile_dyslexia'] = 'Dyslexia';
$string['profile_dyslexia_desc'] = 'Dyslexia-friendly font, wider spacing and a reading guide.';
$string['profile_motor'] = 'Motor difficulty';
$string['profile_motor_desc'] = 'Large cursor, highlighted links and larger text, to make targets easier to find and hit.';
$string['profile_night'] = 'Night mode';
$string['profile_night_desc'] = 'Dark contrast for low-light use.';
$string['profile_seizure_safe'] = 'Less motion';
$string['profile_seizure_safe_desc'] = 'Pauses animations and softens colours.';
$string['profile_senior'] = 'Older adults';
$string['profile_senior_desc'] = 'Larger, bolder text with more line height and a large cursor.';
$string['profile_visually_impaired'] = 'Low vision';
$string['profile_visually_impaired_desc'] = 'Larger text, stronger contrast, a large cursor, a readable font and highlighted links.';
$string['profilesgroup'] = 'Profiles';
$string['protanopia'] = 'Protanopia filter';
$string['reset'] = 'Reset adjustments';
$string['shortcut'] = 'Keyboard shortcut';
$string['shortcut_desc'] = 'Open and close the panel with Alt+A. Turn this off if the shortcut conflicts with a screen reader or browser command.';
$string['shortcut_hint'] = 'Keyboard shortcut: Alt+A';
$string['showadmin'] = 'Show in administration';
$string['showadmin_desc'] = 'Include site administration pages.';
$string['showlogin'] = 'Show on authentication pages';
$string['showlogin_desc'] = 'Include login, signup and password recovery.';
$string['silencemedia'] = 'Mute media';
$string['size'] = 'Desktop button size (px)';
$string['size_desc'] = 'Integer between 48 and 96 pixels.';
$string['status'] = 'Text size';
$string['textcolour'] = 'Button text and icon colour';
$string['title'] = 'Accessibility';
$string['tools'] = 'Available tools';
$string['tools_desc'] = 'Clear all selections to hide the widget and its effects.';
$string['toolsgroup'] = 'Tools';
$string['tritanopia'] = 'Tritanopia filter';
$string['visualgroup'] = 'Visual adjustments';

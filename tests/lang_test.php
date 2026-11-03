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
 * Tests for translation completeness.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility;

use local_sisaccessibility\local\configuration;

/**
 * English and Brazilian Portuguese must cover every string used by the widget.
 *
 * @coversNothing
 */
final class lang_test extends \advanced_testcase {
    /**
     * Load a language file without leaking its $string variable.
     * @param string $code Language code
     * @return string[] Strings
     */
    private static function strings(string $code): array {
        $string = [];
        include(dirname(__DIR__) . '/lang/' . $code . '/local_sisaccessibility.php');
        return $string;
    }

    public function test_languages_have_identical_keys_sorted_and_matching_placeholders(): void {
        $en = self::strings('en');
        $ptbr = self::strings('pt_br');
        $this->assertSame(array_keys($en), array_keys($ptbr));
        $keys = array_keys($en);
        $sorted = $keys;
        sort($sorted, SORT_STRING);
        $this->assertSame($sorted, $keys, 'Language strings must stay alphabetical.');
        foreach ($en as $key => $text) {
            preg_match_all('/\{\$a(?:->\w+)?\}/', $text, $english);
            preg_match_all('/\{\$a(?:->\w+)?\}/', $ptbr[$key], $portuguese);
            $this->assertEqualsCanonicalizing($english[0], $portuguese[0], $key);
        }
    }

    public function test_every_widget_string_exists(): void {
        $en = self::strings('en');
        $required = array_merge(configuration::TOOLS, configuration::LABELS);
        foreach ($required as $key) {
            $this->assertArrayHasKey($key, $en, $key);
            $this->assertNotSame('', trim($en[$key]), $key);
        }
    }
}

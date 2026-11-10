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
 * Tests for the tool-list migration used by db/upgrade.php.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility;

use local_sisaccessibility\local\configuration;

/**
 * Only the untouched original default list may receive the new tools.
 *
 * @covers \local_sisaccessibility\local\configuration
 */
final class upgrade_test extends \advanced_testcase {
    public function test_exact_original_default_receives_new_tools(): void {
        $original = implode(',', configuration::ORIGINAL_TOOLS);
        $this->assertSame(implode(',', configuration::TOOLS), configuration::migrate_tools($original));
        // Order and whitespace differences do not change the fact that the list is the original default.
        $shuffled = implode(', ', array_reverse(configuration::ORIGINAL_TOOLS));
        $this->assertSame(implode(',', configuration::TOOLS), configuration::migrate_tools($shuffled));
    }

    public function test_untouched_release_1_0_default_receives_the_release_1_1_tools(): void {
        $this->assertCount(18, configuration::RELEASE_1_0_TOOLS);
        $this->assertSame(configuration::RELEASE_1_0_TOOLS, array_slice(configuration::TOOLS, 0, 18));
        $stored = implode(',', configuration::RELEASE_1_0_TOOLS);
        $this->assertSame(implode(',', configuration::TOOLS), configuration::migrate_tools($stored));
        $this->assertSame(
            implode(',', configuration::TOOLS),
            configuration::migrate_tools(implode(' , ', array_reverse(configuration::RELEASE_1_0_TOOLS)))
        );
        // One tool the administrator switched off makes it a customised list.
        $this->assertNull(configuration::migrate_tools(implode(',', array_slice(configuration::RELEASE_1_0_TOOLS, 1))));
        $this->assertNull(configuration::migrate_tools($stored . ',protanopia'));
    }

    public function test_custom_selections_are_preserved(): void {
        $this->assertNull(configuration::migrate_tools(''));
        $this->assertNull(configuration::migrate_tools('fontsize,links'));
        $this->assertNull(configuration::migrate_tools(implode(',', array_slice(configuration::ORIGINAL_TOOLS, 1))));
        $this->assertNull(configuration::migrate_tools(implode(',', configuration::ORIGINAL_TOOLS) . ',unknown'));
        $this->assertNull(configuration::migrate_tools(implode(',', configuration::TOOLS)));
        $this->assertNull(configuration::migrate_tools(false));
        $this->assertNull(configuration::migrate_tools(null));
    }

    public function test_original_list_is_the_prefix_of_the_current_list(): void {
        $this->assertSame(configuration::ORIGINAL_TOOLS, array_slice(configuration::TOOLS, 0, 16));
        $this->assertCount(16, configuration::ORIGINAL_TOOLS);
    }
}

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
 * Tests for the declared privacy metadata.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility\privacy;

use core_privacy\local\metadata\collection;

/**
 * Verify the plugin boundary.
 *
 * @covers \local_sisaccessibility\privacy\provider
 */
final class provider_test extends \advanced_testcase {
    public function test_documents_browser_and_core_session_storage(): void {
        $metadata = provider::get_metadata(new collection('local_sisaccessibility'))->get_collection();
        $this->assertCount(2, $metadata);
        $names = array_map(static fn($item) => $item->get_name(), $metadata);
        $this->assertContains('core_user', $names);
        $this->assertContains('browser', $names);
    }
    public function test_is_compliant_with_real_privacy_manager(): void {
        $manager = new \core_privacy\manager();
        $this->assertTrue($manager->component_is_compliant('local_sisaccessibility'));
        $this->assertTrue(is_subclass_of(provider::class, \core_privacy\local\request\plugin\provider::class));
        $this->assertTrue(is_subclass_of(provider::class, \core_privacy\local\request\core_userlist_provider::class));
    }

    public function test_no_plugin_owned_contexts_or_account_profiles(): void {
        $this->assertSame([], provider::get_contexts_for_userid(42)->get_contextids());
    }
}

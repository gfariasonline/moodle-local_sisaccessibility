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
 * Tests for eligible Moodle pages.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility;

use local_sisaccessibility\local\configuration;
use local_sisaccessibility\local\page_policy;

/**
 * Verify the plugin boundary.
 *
 * @covers \local_sisaccessibility\local\page_policy
 */
final class page_policy_test extends \advanced_testcase {
    public function test_excludes_restricted_layouts(): void {
        foreach (['embedded', 'print', 'popup', 'maintenance'] as $layout) {
            $this->assertFalse(page_policy::allows(configuration::normalise(new \stdClass()), $layout, '/', 1));
        }
    }

    public function test_respects_disable_login_admin_and_courses(): void {
        $config = configuration::normalise((object) [
            'showlogin' => 0, 'showadmin' => 0, 'excludedcourses' => '12,34',
        ]);
        $this->assertFalse(page_policy::allows($config, 'login', '/login/forgot_password.php', 1));
        $this->assertFalse(page_policy::allows($config, 'admin', '/customadmin/index.php', 1));
        $this->assertFalse(page_policy::allows($config, 'course', '/course/view.php?id=12', 12));
        $this->assertTrue(page_policy::allows($config, 'course', '/course/view.php?id=13', 13));
        $config['enabled'] = false;
        $this->assertFalse(page_policy::allows($config, 'standard', '/', 1));
    }

    public function test_empty_tools_hides_widget(): void {
        $config = configuration::normalise((object) ['tools' => '']);
        $this->assertFalse(page_policy::allows($config, 'standard', '/', 1));
    }
}

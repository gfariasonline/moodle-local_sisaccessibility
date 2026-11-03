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
 * Explicit HTML page eligibility policy.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility\local;

/**
 * Pure page policy, separate from Moodle output and session creation.
 */
final class page_policy {
    /**
     * Decide if a standard web page may render the widget.
     * @param array $config Validated settings
     * @param string $layout Moodle page layout
     * @param string $path Local URL path (including optional query string)
     * @param int $courseid Current course ID
     * @param string $admindir Configurable admin directory
     * @return bool Whether the widget is eligible
     */
    public static function allows(array $config, string $layout, string $path, int $courseid, string $admindir = 'admin'): bool {
        if (!$config['enabled'] || !$config['tools']) {
            return false;
        }
        if (in_array($layout, ['embedded', 'print', 'popup', 'maintenance'], true)) {
            return false;
        }
        if (!$config['showlogin'] && self::matches_page($layout, $path, 'login', 'login')) {
            return false;
        }
        if (!$config['showadmin'] && self::matches_page($layout, $path, 'admin', $admindir)) {
            return false;
        }
        return !in_array($courseid, $config['excludedcourses'], true);
    }

    /**
     * Match either Moodle's page layout or its corresponding local directory.
     * @param string $layout Current page layout
     * @param string $path Local URL path
     * @param string $expectedlayout Layout to match
     * @param string $directory Directory to match
     * @return bool Whether this is the requested page category
     */
    private static function matches_page(string $layout, string $path, string $expectedlayout, string $directory): bool {
        return $layout === $expectedlayout || strpos($path, '/' . $directory . '/') === 0;
    }
}

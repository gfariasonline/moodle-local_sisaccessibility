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
 * Strict course exclusion setting validation.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility\local;

/**
 * Validate the entire list before Moodle persists administrator input.
 */
final class course_ids_setting extends \admin_setting_configtext {
    /**
     * Validate a course exclusion list.
     * @param mixed $data Submitted value
     * @return bool|string True or localised validation error
     */
    public function validate($data) {
        try {
            configuration::course_ids((string) $data);
            return true;
        } catch (\invalid_parameter_exception $exception) {
            return get_string('invalidcourses', 'local_sisaccessibility');
        }
    }
}

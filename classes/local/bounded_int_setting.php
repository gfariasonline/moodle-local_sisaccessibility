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
 * Bounded integer setting validation.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility\local;

/**
 * Native setting with strict pixel limits.
 */
final class bounded_int_setting extends \admin_setting_configtext {
    /** @var int Minimum accepted value. */
    private int $minimum;
    /** @var int Maximum accepted value. */
    private int $maximum;

    /**
     * Construct a bounded pixel setting.
     * @param string $name Setting identifier
     * @param string $visiblename Localised name
     * @param string $description Localised explanation
     * @param int $default Default value
     * @param int $minimum Minimum value
     * @param int $maximum Maximum value
     */
    public function __construct($name, $visiblename, $description, int $default, int $minimum, int $maximum) {
        parent::__construct($name, $visiblename, $description, $default, PARAM_RAW_TRIMMED);
        $this->minimum = $minimum;
        $this->maximum = $maximum;
    }

    /**
     * Validate an integer without silently coercing floats or unit suffixes.
     * @param mixed $data Submitted input
     * @return bool|string True or localised validation error
     */
    public function validate($data) {
        $value = filter_var($data, FILTER_VALIDATE_INT);
        if ($value === false || $value < $this->minimum || $value > $this->maximum) {
            return get_string(
                'invalidnumber',
                'local_sisaccessibility',
                (object) ['min' => $this->minimum, 'max' => $this->maximum]
            );
        }
        return true;
    }
}

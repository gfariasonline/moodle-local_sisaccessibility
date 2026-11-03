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
 * Upgrade steps.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Execute the plugin upgrade steps.
 *
 * @param int $oldversion Previously installed version
 * @return bool Always true
 */
function xmldb_local_sisaccessibility_upgrade(int $oldversion): bool {
    if ($oldversion < 2026101601) {
        // Enable the tools added after the first release only where the administrator never customised the list.
        $migrated = \local_sisaccessibility\local\configuration::migrate_tools(
            get_config('local_sisaccessibility', 'tools')
        );
        if ($migrated !== null) {
            set_config('tools', $migrated, 'local_sisaccessibility');
        }
        upgrade_plugin_savepoint(true, 2026101601, 'local', 'sisaccessibility');
    }
    return true;
}

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
 * Privacy metadata for local browser settings and transient Moodle session scope.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\metadata\provider as metadata_provider;
use core_privacy\local\request\core_userlist_provider;
use core_privacy\local\request\plugin\provider as request_provider;

/**
 * Browser settings cannot be read or erased remotely by the server.
 * The only server-side user state is in the standard Moodle session, whose
 * lifecycle and privacy deletion are owned by core_user. There are no plugin
 * user tables, user_preferences or account-linked accessibility profiles.
 */
final class provider implements core_userlist_provider, metadata_provider, request_provider {
    /**
     * Declare both storage locations rather than claiming the plugin stores no data.
     * @param collection $collection Metadata collection
     * @return collection Updated collection
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_subsystem_link('core_user', [
            'local_sisaccessibility' => 'privacy:metadata:session:scope',
        ], 'privacy:metadata:session');
        $collection->add_external_location_link('browser', [
            'preferences' => 'privacy:metadata:browser:preferences',
            'scope' => 'privacy:metadata:browser:scope',
        ], 'privacy:metadata:browser');
        return $collection;
    }

    /**
     * There are no plugin-owned account records; core_user owns Moodle sessions.
     * phpcs:ignore moodle.Commenting.ValidTags.Invalid -- Required privacy API parameter has no plugin-owned records.
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @param int $userid Requested account
     * @return \core_privacy\local\request\contextlist Empty plugin-owned context list
     */
    public static function get_contexts_for_userid(int $userid): \core_privacy\local\request\contextlist {
        return new \core_privacy\local\request\contextlist();
    }

    /**
     * No account-linked data is available for server-side export.
     * Browser localStorage must be inspected locally; core_user exports session metadata.
     * phpcs:ignore moodle.Commenting.ValidTags.Invalid -- Required privacy API parameter has no plugin-owned records.
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @param \core_privacy\local\request\approved_contextlist $contextlist Approved request
     */
    public static function export_user_data(\core_privacy\local\request\approved_contextlist $contextlist): void {
        // Intentionally empty: the plugin has no user tables or account preferences.
    }

    /**
     * Plugin-owned data does not exist in any context.
     * Core user erasure destroys Moodle sessions; browser data requires local reset.
     * phpcs:ignore moodle.Commenting.ValidTags.Invalid -- Required privacy API parameter has no plugin-owned records.
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @param \context $context Requested context
     */
    public static function delete_data_for_all_users_in_context(\context $context): void {
        // Do not erase shared core sessions or pretend to erase remote browser storage.
    }

    /**
     * No plugin-owned account records require erasure.
     * phpcs:ignore moodle.Commenting.ValidTags.Invalid -- Required privacy API parameter has no plugin-owned records.
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @param \core_privacy\local\request\approved_contextlist $contextlist Approved request
     */
    public static function delete_data_for_user(\core_privacy\local\request\approved_contextlist $contextlist): void {
        // Core user erasure owns session destruction, including the transient scope.
    }

    /**
     * There are no users with plugin-owned records in the supplied context.
     * phpcs:ignore moodle.Commenting.ValidTags.Invalid -- Required privacy API parameter has no plugin-owned records.
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @param \core_privacy\local\request\userlist $userlist User list to populate
     */
    public static function get_users_in_context(\core_privacy\local\request\userlist $userlist): void {
        // Keep the supplied list empty; no plugin-owned user table exists.
    }

    /**
     * No plugin-owned records require bulk erasure.
     * phpcs:ignore moodle.Commenting.ValidTags.Invalid -- Required privacy API parameter has no plugin-owned records.
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @param \core_privacy\local\request\approved_userlist $userlist Approved users
     */
    public static function delete_data_for_users(\core_privacy\local\request\approved_userlist $userlist): void {
        // Core user erasure destroys shared Moodle sessions separately.
    }
}

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
 * Tests for the browser configuration boundary.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility;

use local_sisaccessibility\local\configuration;

/**
 * Verify the plugin boundary.
 *
 * @covers \local_sisaccessibility\local\configuration
 */
final class client_configuration_test extends \advanced_testcase {
    public function test_scope_is_stable_and_rotates_for_account_changes(): void {
        $this->resetAfterTest();
        $this->setGuestUser();
        $guest = configuration::storage_scope();
        $this->assertSame($guest, configuration::storage_scope());
        $this->setUser($this->getDataGenerator()->create_user());
        $user = configuration::storage_scope();
        $this->assertNotSame($guest, $user);
        $this->assertSame($user, configuration::storage_scope());
        configuration::reset_scope();
        $this->assertNotSame($user, configuration::storage_scope());
        $this->assertMatchesRegularExpression('/^local_sisaccessibility:v1:[a-f0-9]{16}:[a-f0-9]{32}$/', $user);
    }

    public function test_client_payload_contains_only_public_values(): void {
        $this->resetAfterTest();
        $this->setGuestUser();
        $config = configuration::for_client(configuration::normalise((object) ['excludedcourses' => '12']));
        foreach (['enabled', 'showlogin', 'showadmin', 'excludedcourses', 'owner', 'userid'] as $privatekey) {
            $this->assertArrayNotHasKey($privatekey, $config);
        }
        $this->assertArrayNotHasKey('fonturl', $config);
        $this->assertSame((new \moodle_url('/local/sisaccessibility/pix/sis-logo.png'))->out(false), $config['logourl']);
        $this->assertCount(count(configuration::TOOLS) + count(configuration::LABELS), $config['labels']);
    }

    public function test_client_payload_carries_language_and_current_labels(): void {
        global $SESSION;
        $this->resetAfterTest();
        $this->setGuestUser();
        $SESSION->forcelang = 'en';
        $config = configuration::for_client(configuration::normalise(new \stdClass()));
        $this->assertSame(current_language(), $config['language']);
        $this->assertSame(get_string_manager()->get_list_of_translations(), $config['languages']);
        $this->assertArrayNotHasKey('readerurl', $config);
        foreach (['profilesgroup', 'language_pt_br', 'profile_seizure_safe_desc', 'hideimages', 'imagetooltips'] as $label) {
            $this->assertArrayHasKey($label, $config['labels']);
        }
    }

    public function test_storage_keys_are_separate_for_installations_under_one_origin(): void {
        global $CFG;
        $this->resetAfterTest();
        $this->setGuestUser();
        $original = $CFG->wwwroot;
        try {
            $CFG->wwwroot = 'https://example.invalid/moodle-one';
            $first = configuration::storage_scope();
            $CFG->wwwroot = 'https://example.invalid/moodle-two';
            $this->assertNotSame($first, configuration::storage_scope());
        } finally {
            $CFG->wwwroot = $original;
        }
    }
    public function test_language_list_uses_installed_translations(): void {
        $languages = configuration::installed_languages(current_language());
        $this->assertNotEmpty($languages);
        $this->assertSame(get_string_manager()->get_list_of_translations(), $languages);
    }

    public function test_html_configuration_round_trips_without_raw_html_tags(): void {
        $this->resetAfterTest();
        $this->setGuestUser();
        $context = configuration::template_context(configuration::normalise(new \stdClass()));
        $data = json_decode($context['config'], true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame(configuration::TOOLS, $data['tools']);
        $this->assertSame(configuration::storage_scope(), $data['scope']);
        $this->assertStringNotContainsString('<', $context['config']);
        $this->assertStringNotContainsString('>', $context['config']);
    }
}

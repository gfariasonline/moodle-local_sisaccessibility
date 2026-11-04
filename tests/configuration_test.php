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
final class configuration_test extends \advanced_testcase {
    public function test_sanitises_arbitrary_settings(): void {
        $config = configuration::normalise((object) [
            'tools' => 'fontsize,unknown,links,fontsize', 'colour' => 'url(https://invalid.test)',
            'position' => 'fixed;top:0', 'size' => '9999', 'offsetx' => '-1',
        ]);
        $this->assertSame(['fontsize', 'links'], $config['tools']);
        $this->assertSame('#0848CA', $config['colour']);
        $this->assertSame('center-right', $config['position']);
        $this->assertSame(96, $config['size']);
        $this->assertSame(0, $config['offsetx']);
    }

    public function test_default_colours_are_sienna_blue_and_white(): void {
        $config = configuration::normalise(new \stdClass());
        $this->assertSame('#0848CA', $config['colour']);
        $this->assertSame('#FFFFFF', $config['textcolour']);
    }

    public function test_centre_and_corner_positions_are_accepted_with_centre_left_default(): void {
        $defaults = configuration::normalise(new \stdClass());
        $this->assertSame('center-right', $defaults['position']);
        $this->assertSame('center-right', $defaults['mobileposition']);
        foreach (['center-left', 'center-right', 'bottom-left', 'bottom-right', 'top-left', 'top-right'] as $position) {
            $config = configuration::normalise((object) ['position' => $position, 'mobileposition' => $position]);
            $this->assertSame($position, $config['position']);
            $this->assertSame($position, $config['mobileposition']);
        }
        $invalid = configuration::normalise((object) ['position' => 'center', 'mobileposition' => 'top']);
        $this->assertSame('center-right', $invalid['position']);
        $this->assertSame('center-right', $invalid['mobileposition']);
    }

    public function test_empty_tool_selection_stays_empty(): void {
        $this->assertSame([], configuration::normalise((object) ['tools' => ''])['tools']);
        $this->assertSame(configuration::TOOLS, configuration::normalise(new \stdClass())['tools']);
    }

    public function test_course_ids_reject_invalid_input(): void {
        $this->assertSame([2, 13], configuration::course_ids('2, 13 2'));
        $this->expectException(\invalid_parameter_exception::class);
        configuration::course_ids('2,13oops');
    }

    public function test_extended_tools_are_bundled_and_enabled_by_default(): void {
        foreach (['hideimages', 'imagetooltips'] as $tool) {
            $this->assertContains($tool, configuration::TOOLS);
        }
        $this->assertSame(array_values(array_unique(configuration::TOOLS)), configuration::TOOLS);
        $this->assertSame(configuration::TOOLS, configuration::normalise(new \stdClass())['tools']);
    }

    public function test_removed_tools_and_labels_are_rejected_from_stored_configuration(): void {
        $removed = ['superfocus', 'pdfreader', 'pagestructure', 'screenreader'];
        $config = configuration::normalise((object) ['tools' => implode(',', array_merge($removed, ['links']))]);
        $this->assertSame(['links'], $config['tools']);
        $this->assertCount(18, configuration::TOOLS);
        foreach ($removed as $tool) {
            $this->assertNotContains($tool, configuration::TOOLS);
            $this->assertNotContains($tool, configuration::LABELS);
        }
        foreach (['profile_blind', 'profile_motor_impaired'] as $profile) {
            $this->assertNotContains($profile, configuration::LABELS);
        }
    }

    public function test_button_foreground_is_adjusted_to_wcag_contrast(): void {
        $cases = [
            ['#FF7A00', '#FFFFFF', '#000000'],
            ['#111111', '#000000', '#FFFFFF'],
            ['#FFFFFF', '#191919', '#191919'],
        ];
        foreach ($cases as [$background, $foreground, $expected]) {
            $config = configuration::normalise((object) ['colour' => $background, 'textcolour' => $foreground]);
            $this->assertSame($background, $config['colour']);
            $this->assertSame($expected, $config['textcolour']);
            $this->assertGreaterThanOrEqual(4.5, configuration::contrast_ratio($config['colour'], $config['textcolour']));
        }
    }
}

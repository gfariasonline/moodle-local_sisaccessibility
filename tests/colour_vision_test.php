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
 * Tests for the colour-vision filter definitions.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility;

use local_sisaccessibility\local\colour_vision;
use local_sisaccessibility\local\configuration;

/**
 * The matrices must be well formed, keep neutral colours and match the tools the administrator can enable.
 *
 * @covers \local_sisaccessibility\local\colour_vision
 */
final class colour_vision_test extends \advanced_testcase {
    public function test_every_colour_vision_tool_has_a_matrix_and_the_reverse(): void {
        $tools = array_values(array_intersect(configuration::TOOLS, ['protanopia', 'deuteranopia', 'tritanopia']));
        $this->assertSame($tools, array_keys(colour_vision::MATRICES));
        $this->assertSame($tools, colour_vision::enabled_in(configuration::TOOLS));
        $this->assertSame(['deuteranopia'], colour_vision::enabled_in(['bold', 'deuteranopia', 'unknown']));
        $this->assertSame([], colour_vision::enabled_in([]));
    }

    public function test_matrices_are_four_by_five_and_rows_sum_to_one_so_greys_are_unchanged(): void {
        foreach (colour_vision::MATRICES as $tool => $values) {
            $numbers = array_map('floatval', explode(' ', $values));
            $this->assertCount(20, $numbers, $tool);
            foreach ([0, 1, 2] as $row) {
                $this->assertEqualsWithDelta(1.0, array_sum(array_slice($numbers, $row * 5, 3)), 0.0001, $tool . ' row ' . $row);
                $this->assertSame([0.0, 0.0], array_slice($numbers, $row * 5 + 3, 2), 'No alpha or offset term in ' . $tool);
            }
            $this->assertSame([0.0, 0.0, 0.0, 1.0, 0.0], array_slice($numbers, 15, 5), 'Alpha is preserved in ' . $tool);
        }
    }

    public function test_svg_defines_one_filter_per_enabled_tool_and_is_valid_xml(): void {
        $this->assertSame('', colour_vision::svg(['bold', 'monochrome']));
        $markup = colour_vision::svg(['bold', 'tritanopia', 'protanopia']);
        $document = new \DOMDocument();
        $this->assertTrue($document->loadXML($markup));
        $this->assertSame(colour_vision::SVG_ID, $document->documentElement->getAttribute('id'));
        $this->assertSame('true', $document->documentElement->getAttribute('aria-hidden'));
        $ids = [];
        foreach ($document->getElementsByTagName('filter') as $filter) {
            $ids[] = $filter->getAttribute('id');
            $matrix = $filter->getElementsByTagName('feColorMatrix')->item(0);
            $tool = substr($filter->getAttribute('id'), strlen('sis-a11y-'));
            $this->assertSame(colour_vision::MATRICES[$tool], $matrix->getAttribute('values'));
        }
        $this->assertSame(['sis-a11y-protanopia', 'sis-a11y-tritanopia'], $ids);
        $this->assertStringNotContainsString('deuteranopia', $markup);
        $this->assertStringNotContainsString('color-interpolation-filters', $markup, 'linearRGB is what the matrices expect');
    }
}

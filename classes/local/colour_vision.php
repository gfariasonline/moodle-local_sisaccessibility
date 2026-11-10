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
 * Colour-vision filter definitions, the single source of the SVG matrices.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility\local;

/**
 * Daltonisation matrices rendered once into the page; the browser module reads them back from the SVG.
 *
 * Each matrix is M = I + C (I - S), where S is the Machado, Oliveira and Fernandes (2009) dichromacy
 * simulation matrix for linear RGB at full severity and C moves the information a dichromat cannot
 * see into the channels they can. Each row sums to 1, so white and greys are unchanged. This is an
 * aid to tell colours apart, not a clinical correction.
 */
final class colour_vision {
    /** @var string Identifier of the hidden SVG that holds every filter. */
    public const SVG_ID = 'sis-a11y-filters';

    /** @var string[] Four-by-five feColorMatrix values, indexed by tool. */
    public const MATRICES = [
        'protanopia' => '1 0 0 0 0 0.478897 0.476911 0.044192 0 0 0.597282 -0.688692 1.09141 0 0 0 0 0 1 0',
        'deuteranopia' => '1 0 0 0 0 0.16279 0.725047 0.112165 0 0 0.454695 -0.645392 1.190697 0 0 0 0 0 1 0',
        'tritanopia' => '0.741159 -0.407208 0.666049 0 0 0.075098 0.585234 0.339668 0 0 0 0 1 0 0 0 0 0 1 0',
    ];

    /**
     * Tools of this group that the administrator left enabled.
     * @param string[] $tools Enabled tool identifiers
     * @return string[] Colour-vision tools, in definition order
     */
    public static function enabled_in(array $tools): array {
        return array_values(array_intersect(array_keys(self::MATRICES), $tools));
    }

    /**
     * Hidden SVG that defines one filter per enabled tool. Empty when no such tool is enabled.
     * @param string[] $tools Enabled tool identifiers
     * @return string SVG markup
     */
    public static function svg(array $tools): string {
        $enabled = self::enabled_in($tools);
        if (!$enabled) {
            return '';
        }
        $filters = '';
        foreach ($enabled as $tool) {
            // The default linearRGB interpolation is what the Machado matrices expect.
            $filters .= '<filter id="sis-a11y-' . $tool . '"><feColorMatrix type="matrix" values="' .
                self::MATRICES[$tool] . '"/></filter>';
        }
        return '<svg id="' . self::SVG_ID . '" xmlns="http://www.w3.org/2000/svg" width="0" height="0" ' .
            'aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">' .
            '<defs>' . $filters . '</defs></svg>';
    }
}

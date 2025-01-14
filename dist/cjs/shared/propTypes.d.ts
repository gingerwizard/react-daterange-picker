import PropTypes from 'prop-types';
import type { Requireable, Validator } from 'prop-types';
import type { Range } from './types.js';
export declare const isMinDate: Validator<Date | null | undefined>;
export declare const isMaxDate: Validator<Date | null | undefined>;
export declare const rangeOf: <T>(type: PropTypes.Requireable<T>) => PropTypes.Requireable<Range<T>>;

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import makeEventProps from 'make-event-props';
import clsx from 'clsx';
import Calendar from 'react-calendar';
import Fit from 'react-fit';

import DateInput from 'react-date-picker/dist/esm/DateInput';

import { isMaxDate, isMinDate, rangeOf } from './shared/propTypes.js';

import type { ReactNodeArray } from 'prop-types';
import type {
  ClassName,
  CloseReason,
  Detail,
  LooseValue,
  OpenReason,
  Value,
} from './shared/types.js';

const isBrowser = typeof document !== 'undefined';

const baseClassName = 'react-daterange-picker';
const outsideActionEvents = ['mousedown', 'focusin', 'touchstart'] as const;
const allViews = ['century', 'decade', 'year', 'month'] as const;

const iconProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 19,
  height: 19,
  viewBox: '0 0 19 19',
  stroke: 'black',
  strokeWidth: 2,
};

const CalendarIcon = (
  <svg
    {...iconProps}
    className={`${baseClassName}__calendar-button__icon ${baseClassName}__button__icon`}
  >
    <rect fill="none" height="15" width="15" x="2" y="2" />
    <line x1="6" x2="6" y1="0" y2="4" />
    <line x1="13" x2="13" y1="0" y2="4" />
  </svg>
);

const ClearIcon = (
  <svg
    {...iconProps}
    className={`${baseClassName}__clear-button__icon ${baseClassName}__button__icon`}
  >
    <line x1="4" x2="15" y1="4" y2="15" />
    <line x1="15" x2="4" y1="4" y2="15" />
  </svg>
);

type Icon = React.ReactElement | ReactNodeArray | null | string | number | boolean;

type IconOrRenderFunction = Icon | React.ComponentType | React.ReactElement;

type CalendarProps = Omit<
  React.ComponentPropsWithoutRef<typeof Calendar>,
  'className' | 'maxDetail' | 'onChange'
>;

type EventProps = ReturnType<typeof makeEventProps>;

export type DateRangePickerProps = {
  autoFocus?: boolean;
  calendarAriaLabel?: string;
  calendarClassName?: ClassName;
  calendarIcon?: IconOrRenderFunction | null;
  className?: ClassName;
  clearAriaLabel?: string;
  clearIcon?: IconOrRenderFunction | null;
  closeCalendar?: boolean;
  'data-testid'?: string;
  dayAriaLabel?: string;
  dayPlaceholder?: string;
  disableCalendar?: boolean;
  disabled?: boolean;
  format?: string;
  id?: string;
  isOpen?: boolean;
  locale?: string;
  maxDate?: Date;
  maxDetail?: Detail;
  minDate?: Date;
  monthAriaLabel?: string;
  monthPlaceholder?: string;
  name?: string;
  nativeInputAriaLabel?: string;
  onCalendarClose?: () => void;
  onCalendarOpen?: () => void;
  onChange?: (value: Value) => void;
  onFocus?: (event: React.FocusEvent<HTMLDivElement>) => void;
  onInvalidChange?: () => void;
  openCalendarOnFocus?: boolean;
  portalContainer?: HTMLElement | null;
  rangeDivider?: React.ReactNode;
  required?: boolean;
  shouldCloseCalendar?: (props: { reason: CloseReason }) => boolean;
  shouldOpenCalendar?: (props: { reason: OpenReason }) => boolean;
  showLeadingZeros?: boolean;
  value?: LooseValue;
  yearAriaLabel?: string;
  yearPlaceholder?: string;
} & CalendarProps &
  Omit<EventProps, 'onChange' | 'onFocus'>;

const DateRangePicker: React.FC<DateRangePickerProps> = function DateRangePicker(props) {
  const {
    autoFocus,
    calendarAriaLabel,
    calendarIcon = CalendarIcon,
    className,
    clearAriaLabel,
    clearIcon = ClearIcon,
    closeCalendar: shouldCloseCalendarOnSelect = true,
    'data-testid': dataTestid,
    dayAriaLabel,
    dayPlaceholder,
    disableCalendar,
    disabled,
    format,
    id,
    isOpen: isOpenProps = null,
    locale,
    maxDate,
    maxDetail = 'month',
    minDate,
    monthAriaLabel,
    monthPlaceholder,
    name = 'daterange',
    nativeInputAriaLabel,
    onCalendarClose,
    onCalendarOpen,
    onChange: onChangeProps,
    onFocus: onFocusProps,
    onInvalidChange,
    openCalendarOnFocus = true,
    rangeDivider = '–',
    required,
    shouldCloseCalendar,
    shouldOpenCalendar,
    showLeadingZeros,
    value,
    yearAriaLabel,
    yearPlaceholder,
    ...otherProps
  } = props;

  const [isOpen, setIsOpen] = useState(isOpenProps);
  const wrapper = useRef<HTMLDivElement>(null);
  const calendarWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(isOpenProps);
  }, [isOpenProps]);

  function openCalendar({ reason }: { reason: OpenReason }) {
    if (shouldOpenCalendar) {
      if (!shouldOpenCalendar({ reason })) {
        return;
      }
    }

    setIsOpen(true);

    if (onCalendarOpen) {
      onCalendarOpen();
    }
  }

  const closeCalendar = useCallback(
    ({ reason }: { reason: CloseReason }) => {
      if (shouldCloseCalendar) {
        if (!shouldCloseCalendar({ reason })) {
          return;
        }
      }

      setIsOpen(false);

      if (onCalendarClose) {
        onCalendarClose();
      }
    },
    [onCalendarClose, shouldCloseCalendar],
  );

  function toggleCalendar() {
    if (isOpen) {
      closeCalendar({ reason: 'buttonClick' });
    } else {
      openCalendar({ reason: 'buttonClick' });
    }
  }

  function onChange(value: Value, shouldCloseCalendar: boolean = shouldCloseCalendarOnSelect) {
    if (shouldCloseCalendar) {
      closeCalendar({ reason: 'select' });
    }

    if (onChangeProps) {
      onChangeProps(value);
    }
  }

  function onChangeFrom(nextValue: Value, closeCalendar: boolean) {
    const [nextValueFrom] = Array.isArray(nextValue) ? nextValue : [nextValue];
    const [, valueTo] = Array.isArray(value) ? value : [value];

    const valueToDate = valueTo ? new Date(valueTo) : null;

    onChange([nextValueFrom, valueToDate], closeCalendar);
  }

  function onChangeTo(nextValue: Value, closeCalendar: boolean) {
    const [, nextValueTo] = Array.isArray(nextValue) ? nextValue : [null, nextValue];
    const [valueFrom] = Array.isArray(value) ? value : [value];

    const valueFromDate = valueFrom ? new Date(valueFrom) : null;

    onChange([valueFromDate, nextValueTo], closeCalendar);
  }

  function onFocus(event: React.FocusEvent<HTMLInputElement>) {
    if (onFocusProps) {
      onFocusProps(event);
    }

    if (
      // Internet Explorer still fires onFocus on disabled elements
      disabled ||
      isOpen ||
      !openCalendarOnFocus ||
      event.target.dataset.select === 'true'
    ) {
      return;
    }

    openCalendar({ reason: 'focus' });
  }

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCalendar({ reason: 'escape' });
      }
    },
    [closeCalendar],
  );

  function clear() {
    onChange(null);
  }

  function stopPropagation(event: React.FocusEvent) {
    event.stopPropagation();
  }

  const onOutsideAction = useCallback(
    (event: Event) => {
      const { current: wrapperEl } = wrapper;
      const { current: calendarWrapperEl } = calendarWrapper;

      // Try event.composedPath first to handle clicks inside a Shadow DOM.
      const target = (
        'composedPath' in event ? event.composedPath()[0] : (event as Event).target
      ) as HTMLElement;

      if (
        target &&
        wrapperEl &&
        !wrapperEl.contains(target) &&
        (!calendarWrapperEl || !calendarWrapperEl.contains(target))
      ) {
        closeCalendar({ reason: 'outsideAction' });
      }
    },
    [calendarWrapper, closeCalendar, wrapper],
  );

  const handleOutsideActionListeners = useCallback(
    (shouldListen = isOpen) => {
      outsideActionEvents.forEach((event) => {
        if (shouldListen) {
          document.addEventListener(event, onOutsideAction);
        } else {
          document.removeEventListener(event, onOutsideAction);
        }
      });

      if (shouldListen) {
        document.addEventListener('keydown', onKeyDown);
      } else {
        document.removeEventListener('keydown', onKeyDown);
      }
    },
    [isOpen, onOutsideAction, onKeyDown],
  );

  useEffect(() => {
    handleOutsideActionListeners();

    return () => {
      handleOutsideActionListeners(false);
    };
  }, [handleOutsideActionListeners, isOpen]);

  function renderInputs() {
    const [valueFrom, valueTo] = Array.isArray(value) ? value : [value];

    const ariaLabelProps = {
      dayAriaLabel,
      monthAriaLabel,
      nativeInputAriaLabel,
      yearAriaLabel,
    };

    const placeholderProps = {
      dayPlaceholder,
      monthPlaceholder,
      yearPlaceholder,
    };

    const commonProps = {
      ...ariaLabelProps,
      ...placeholderProps,
      className: `${baseClassName}__inputGroup`,
      disabled,
      format,
      isCalendarOpen: isOpen,
      locale,
      maxDate,
      maxDetail,
      minDate,
      onInvalidChange,
      required,
      showLeadingZeros,
    };

    return (
      <div className={`${baseClassName}__wrapper`}>
        {calendarIcon !== null && !disableCalendar && (
          <button
            aria-label={calendarAriaLabel}
            className={`${baseClassName}__calendar-button ${baseClassName}__button`}
            disabled={disabled}
            onClick={toggleCalendar}
            onFocus={stopPropagation}
            type="button"
          >
            {typeof calendarIcon === 'function' ? React.createElement(calendarIcon) : calendarIcon}
          </button>
        )}
        <DateInput
          {...commonProps}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          name={`${name}_from`}
          onChange={onChangeFrom}
          returnValue="start"
          value={valueFrom}
        />
        <span className={`${baseClassName}__range-divider`}>{rangeDivider}</span>
        <DateInput
          {...commonProps}
          name={`${name}_to`}
          onChange={onChangeTo}
          returnValue="end"
          value={valueTo}
        />
        {clearIcon !== null && (
          <button
            aria-label={clearAriaLabel}
            className={`${baseClassName}__clear-button ${baseClassName}__button`}
            disabled={disabled}
            onClick={clear}
            onFocus={stopPropagation}
            type="button"
          >
            {typeof clearIcon === 'function' ? React.createElement(clearIcon) : clearIcon}
          </button>
        )}
      </div>
    );
  }

  function renderCalendar() {
    if (isOpen === null || disableCalendar) {
      return null;
    }

    const {
      calendarClassName,
      className: dateRangePickerClassName, // Unused, here to exclude it from calendarProps
      onChange: onChangeProps, // Unused, here to exclude it from calendarProps
      portalContainer,
      value,
      ...calendarProps
    } = props;

    const className = `${baseClassName}__calendar`;
    const classNames = clsx(className, `${className}--${isOpen ? 'open' : 'closed'}`);

    const calendar = (
      <Calendar
        className={calendarClassName}
        onChange={(value) => onChange(value)}
        selectRange
        value={value}
        {...calendarProps}
      />
    );

    return portalContainer ? (
      createPortal(
        <div ref={calendarWrapper} className={classNames}>
          {calendar}
        </div>,
        portalContainer,
      )
    ) : (
      <Fit>
        <div
          ref={(ref) => {
            if (ref && !isOpen) {
              ref.removeAttribute('style');
            }
          }}
          className={classNames}
        >
          {calendar}
        </div>
      </Fit>
    );
  }

  const eventProps = useMemo(() => makeEventProps(otherProps), [otherProps]);

  return (
    <div
      className={clsx(
        baseClassName,
        `${baseClassName}--${isOpen ? 'open' : 'closed'}`,
        `${baseClassName}--${disabled ? 'disabled' : 'enabled'}`,
        className,
      )}
      data-testid={dataTestid}
      id={id}
      {...eventProps}
      onFocus={onFocus}
      ref={wrapper}
    >
      {renderInputs()}
      {renderCalendar()}
    </div>
  );
};

const isValue = PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]);

const isValueOrValueArray = PropTypes.oneOfType([isValue, rangeOf(isValue)]);

DateRangePicker.propTypes = {
  autoFocus: PropTypes.bool,
  calendarAriaLabel: PropTypes.string,
  calendarClassName: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  calendarIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  clearAriaLabel: PropTypes.string,
  clearIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  closeCalendar: PropTypes.bool,
  'data-testid': PropTypes.string,
  dayAriaLabel: PropTypes.string,
  dayPlaceholder: PropTypes.string,
  disableCalendar: PropTypes.bool,
  disabled: PropTypes.bool,
  format: PropTypes.string,
  id: PropTypes.string,
  isOpen: PropTypes.bool,
  locale: PropTypes.string,
  maxDate: isMaxDate,
  maxDetail: PropTypes.oneOf(allViews),
  minDate: isMinDate,
  monthAriaLabel: PropTypes.string,
  monthPlaceholder: PropTypes.string,
  name: PropTypes.string,
  nativeInputAriaLabel: PropTypes.string,
  onCalendarClose: PropTypes.func,
  onCalendarOpen: PropTypes.func,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  openCalendarOnFocus: PropTypes.bool,
  portalContainer: isBrowser ? PropTypes.instanceOf(HTMLElement) : undefined,
  rangeDivider: PropTypes.node,
  required: PropTypes.bool,
  showLeadingZeros: PropTypes.bool,
  value: isValueOrValueArray,
  yearAriaLabel: PropTypes.string,
  yearPlaceholder: PropTypes.string,
};

export default DateRangePicker;

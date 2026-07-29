import React, { forwardRef } from 'react';
import { Button } from '../atoms/Button.jsx';
import { Stack } from '../layout/Stack.jsx';

/**
 * @type {React.ForwardRefExoticComponent<{
 *   hasNextPage: boolean,
 *   hasPreviousPage?: boolean,
 *   onNext?: () => void,
 *   onPrevious?: () => void,
 *   [key: string]: any
 * } & React.RefAttributes<any>>}
 */
export const PaginationControls = forwardRef(function PaginationControls({ hasNextPage, hasPreviousPage = false, onNext, onPrevious, ...rest }, ref) {
  return React.createElement(
    Stack,
    { ref, direction: 'row', gap: 'sm', align: 'center', justify: 'center', ...rest },
    React.createElement(
      Button,
      {
        variant: 'subdued',
        disabled: !hasPreviousPage,
        onClick: onPrevious,
        'aria-label': 'Previous page',
      },
      'Previous'
    ),
    React.createElement(
      Button,
      {
        variant: 'primary',
        disabled: !hasNextPage,
        onClick: onNext,
        'aria-label': 'Next page',
      },
      'Next'
    )
  );
});


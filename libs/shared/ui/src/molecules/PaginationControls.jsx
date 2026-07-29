import React from 'react';
import { Button } from '../atoms/Button.jsx';
import { Stack } from '../layout/Stack.jsx';

/**
 * @param {{
 *   hasNextPage: boolean,
 *   hasPreviousPage?: boolean,
 *   onNext?: () => void,
 *   onPrevious?: () => void
 * }} props
 */
export function PaginationControls({ hasNextPage, hasPreviousPage = false, onNext, onPrevious }) {
  return React.createElement(
    Stack,
    { direction: 'row', gap: 'sm', align: 'center', justify: 'center' },
    React.createElement(
      Button,
      {
        variant: 'subdued',
        disabled: !hasPreviousPage,
        onClick: onPrevious,
        ariaLabel: 'Previous page',
      },
      'Previous'
    ),
    React.createElement(
      Button,
      {
        variant: 'primary',
        disabled: !hasNextPage,
        onClick: onNext,
        ariaLabel: 'Next page',
      },
      'Next'
    )
  );
}

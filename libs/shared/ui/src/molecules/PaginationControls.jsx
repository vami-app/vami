const React = require('react');
const Button = require('../atoms/Button');
const Stack = require('../layout/Stack');

/**
 * @param {{
 *   hasNextPage: boolean,
 *   hasPreviousPage?: boolean,
 *   onNext?: () => void,
 *   onPrevious?: () => void
 * }} props
 */
function PaginationControls({ hasNextPage, hasPreviousPage = false, onNext, onPrevious }) {
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

module.exports = PaginationControls;

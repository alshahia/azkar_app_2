
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OfflineIndicator from '../../components/common/OfflineIndicator';

describe('OfflineIndicator', () => {
    it('renders nothing while online', () => {
        const { container } = render(<OfflineIndicator />);
        expect(container).toBeEmptyDOMElement();
    });
});

import { Box, Typography, Button } from '@mui/material';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        py: 8, px: 4,
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', opacity: 0.4, '& svg': { fontSize: 48 } }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360, mb: action ? 3 : 0 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}

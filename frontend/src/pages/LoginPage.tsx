import { Box, Button, Card, CardContent, CircularProgress, Divider, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, isLoading } = useAuth();

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'background.default',
    }}>
      <Card elevation={3} sx={{ width: 380, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '12px',
              background: 'linear-gradient(135deg, #5C6BC0 0%, #3949AB 100%)',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 2px 8px rgba(57,73,171,0.35)',
            }}>
              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 16, fontFamily: '"Inter Tight", sans-serif' }}>
                IA
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>
                Interview Assistant
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                Your AI-powered interview toolkit
              </Typography>
            </Box>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Welcome back</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Sign in to access your interviews and reports.
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={loginWithGoogle}
                sx={{ mb: 1.5, borderColor: 'divider', color: 'text.primary', fontWeight: 500, textTransform: 'none' }}
              >
                Continue with Google
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>or</Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<EmailOutlinedIcon />}
                onClick={loginWithEmail}
                sx={{ borderColor: 'divider', color: 'text.primary', fontWeight: 500, textTransform: 'none' }}
              >
                Continue with email
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

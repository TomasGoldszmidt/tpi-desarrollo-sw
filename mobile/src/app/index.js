import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { iniciarSesion } from '../api/sesiones.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado.js';
import { CargaEncima } from '../components/CargaEncima.js';
import { Aviso } from '../components/Aviso.js';
import { BotonPrincipal } from '../components/BotonPrincipal.js';
import { Campo } from '../components/Campo.js';
import { CampoContrasenia } from '../components/CampoContrasenia.js';
import { emailValido } from '../validaciones.js';
import { Logo } from '../components/Logo.js';
import { Marca } from '../components/Marca.js';
import { colors, fontSize, spacing, TOQUE_MINIMO } from '../theme.js';

// Primera pantalla: iniciar sesión con email y contraseña. Desde acá se va a crear una cuenta.
// En tablet el formulario queda centrado con un ancho máximo.
export default function IniciarSesion() {
  const { usuario, iniciarSesion: entrar } = useUsuario();
  const alturaTeclado = useAlturaTeclado();
  const campoContrasenia = useRef(null);
  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorIngreso, setErrorIngreso] = useState(null);

  // Con la sesión ya iniciada (ej: se acaba de crear la cuenta) se va directo a la app.
  if (usuario) {
    return <Redirect href="/catalogo" />;
  }

  const errores = {
    email: email.trim() === '' ? 'Completá tu email.' : !emailValido(email) ? 'Revisá el email.' : null,
    contrasenia: contrasenia === '' ? 'Completá tu contraseña.' : null,
  };

  async function ingresar() {
    setErrorIngreso(null);
    if (errores.email || errores.contrasenia) {
      setIntentado(true);
      return;
    }
    setEnviando(true);
    try {
      const cuenta = await iniciarSesion(email.trim(), contrasenia);
      // Con la sesión iniciada, la pantalla se redirige sola al catálogo.
      entrar(cuenta);
    } catch (e) {
      setErrorIngreso(e.message);
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.formulario}>
          <View style={styles.encabezado}>
            <Logo size="large" />
            <Marca fontSize={30} />
            <Text style={styles.lema}>ENTRADAS A UN CLICK</Text>
          </View>

          <Text style={styles.titulo}>Iniciá sesión</Text>

          <Campo
            etiqueta="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => campoContrasenia.current?.focus()}
            error={intentado ? errores.email : null}
          />
          <CampoContrasenia
            ref={campoContrasenia}
            etiqueta="Contraseña"
            value={contrasenia}
            onChangeText={setContrasenia}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={ingresar}
            error={intentado ? errores.contrasenia : null}
          />

          {/* El error de credenciales va pegado al botón, donde se está mirando. */}
          <Aviso>{errorIngreso}</Aviso>
          <BotonPrincipal titulo="Ingresar" onPress={ingresar} />

          <Pressable style={styles.link} onPress={() => router.push('/registro')} accessibilityRole="link">
            <Text style={styles.linkTexto}>
              ¿No tenés cuenta? <Text style={styles.linkAccion}>Creá una</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {enviando ? <CargaEncima mensaje="Ingresando…" /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  formulario: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  encabezado: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  lema: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    letterSpacing: 3,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  link: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOQUE_MINIMO + 4,
    marginTop: spacing.sm,
  },
  linkTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  linkAccion: {
    color: colors.primaryText,
    fontWeight: 'bold',
  },
});

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { actualizarUsuario } from '../api/usuarios.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado.js';
import { Avatar } from '../components/Avatar.js';
import { CargaEncima } from '../components/Carga.js';
import { Aviso, BotonPrincipal, Campo, CampoContrasenia, MIN_CONTRASENIA, emailValido } from '../components/Formulario.js';
import { colors, fontSize, spacing } from '../theme.js';

// Editar el perfil del usuario que inició sesión. Los datos salen de la sesión, que
// siempre está al día: solo el propio usuario los cambia, y al guardar se actualiza.
export default function Perfil() {
  const { usuario, actualizarCuenta } = useUsuario();
  const alturaTeclado = useAlturaTeclado();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [apellido, setApellido] = useState(usuario.apellido);
  const [email, setEmail] = useState(usuario.email);
  const [contraseniaActual, setContraseniaActual] = useState('');
  const [contraseniaNueva, setContraseniaNueva] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cambiaContrasenia = contraseniaActual !== '' || contraseniaNueva !== '';
  const errores = {
    nombre: nombre.trim() === '' ? 'Completá tu nombre.' : null,
    apellido: apellido.trim() === '' ? 'Completá tu apellido.' : null,
    email: email.trim() === '' ? 'Completá tu email.' : !emailValido(email) ? 'Revisá el email.' : null,
    contraseniaActual: cambiaContrasenia && contraseniaActual === '' ? 'Ingresá tu contraseña actual.' : null,
    contraseniaNueva:
      cambiaContrasenia && contraseniaNueva === '' ? 'Ingresá la nueva contraseña.'
        : contraseniaNueva !== '' && contraseniaNueva.length < MIN_CONTRASENIA
          ? `Tiene que tener al menos ${MIN_CONTRASENIA} caracteres.`
          : null,
  };
  const marcar = (campo) => (intentado ? errores[campo] : null);

  // Solo se manda lo que cambió.
  function armarCambios() {
    const cambios = {};
    if (nombre.trim() !== usuario.nombre) cambios.nombre = nombre.trim();
    if (apellido.trim() !== usuario.apellido) cambios.apellido = apellido.trim();
    if (email.trim().toLowerCase() !== usuario.email) cambios.email = email.trim();
    if (cambiaContrasenia) {
      cambios.contraseniaActual = contraseniaActual;
      cambios.contraseniaNueva = contraseniaNueva;
    }
    return cambios;
  }

  async function guardar() {
    setAviso(null);
    if (Object.values(errores).some(Boolean)) {
      setIntentado(true);
      return;
    }
    const cambios = armarCambios();
    if (Object.keys(cambios).length === 0) {
      setAviso({ tipo: 'error', texto: 'No hay cambios para guardar.' });
      return;
    }
    setEnviando(true);
    try {
      const cuenta = await actualizarUsuario(usuario.id, cambios);
      actualizarCuenta(cuenta);
      setNombre(cuenta.nombre);
      setApellido(cuenta.apellido);
      setEmail(cuenta.email);
      setContraseniaActual('');
      setContraseniaNueva('');
      setIntentado(false);
      setAviso({ tipo: 'ok', texto: 'Guardamos tus cambios.' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.encabezado}>
          <Avatar usuario={usuario} size={44} />
          <Text style={styles.titulo}>Tu perfil</Text>
        </View>
        <Aviso tipo={aviso?.tipo}>{aviso?.texto}</Aviso>

        <View style={styles.fila}>
          <Campo
            style={styles.mitad}
            etiqueta="Nombre"
            value={nombre}
            onChangeText={setNombre}
            autoComplete="given-name"
            error={marcar('nombre')}
          />
          <Campo
            style={styles.mitad}
            etiqueta="Apellido"
            value={apellido}
            onChangeText={setApellido}
            autoComplete="family-name"
            error={marcar('apellido')}
          />
        </View>
        <Campo
          etiqueta="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          error={marcar('email')}
        />

        <Text style={styles.subtitulo}>Cambiar contraseña</Text>
        <Text style={styles.ayuda}>Dejalo vacío para no cambiarla.</Text>
        <CampoContrasenia
          etiqueta="Contraseña actual"
          value={contraseniaActual}
          onChangeText={setContraseniaActual}
          placeholder="Contraseña actual"
          autoComplete="current-password"
          error={marcar('contraseniaActual')}
        />
        <CampoContrasenia
          etiqueta="Nueva contraseña"
          value={contraseniaNueva}
          onChangeText={setContraseniaNueva}
          placeholder={`Al menos ${MIN_CONTRASENIA} caracteres`}
          autoComplete="new-password"
          error={marcar('contraseniaNueva')}
        />

        <BotonPrincipal titulo="Guardar cambios" onPress={guardar} />
      </ScrollView>

      {enviando ? <CargaEncima mensaje="Guardando tus cambios…" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  fila: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mitad: {
    flex: 1,
  },
  subtitulo: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.xl,
  },
  ayuda: {
    color: colors.textMuted,
    fontSize: fontSize.small,
  },
});

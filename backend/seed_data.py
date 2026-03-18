# Portadas: Wikimedia Commons (dominio público). Imagen genérica para cuentos sin portada propia.
W = "https://upload.wikimedia.org/wikipedia/commons"
DEFAULT_COVER = f"{W}/a/a6/Snow_White_illustration_from_german_children%27s_book_1919_%283917968514%29.jpg"


def get_demos():
    """Lista de (titulo, descripcion, portada, categoria) para 100 cuentos."""
    base = [
        ("Caperucita Roja", "Un clásico cuento del bosque.", f"{W}/7/7d/Little_Red_Riding_Hood.png", "Clásicos"),
        ("Los Tres Cerditos", "Tres hermanos y un lobo muy soplón.", f"{W}/8/8b/Three_little_pigs_1904_straw_house.jpg", "Clásicos"),
        ("La Sirenita", "Una aventura bajo el mar.", f"{W}/2/24/Undine_and_Sintram.jpg", "Princesas"),
        ("Blancanieves", "Una princesa, una manzana y siete enanitos.", f"{W}/a/a6/Snow_White_illustration_from_german_children%27s_book_1919_%283917968514%29.jpg", "Princesas"),
        ("Hansel y Gretel", "Dos hermanos perdidos en el bosque.", f"{W}/a/a0/Hansel_and_Gretel_-_Arthur_Rackham.jpg", "Aventuras"),
        ("Cenicienta", "Un zapato de cristal y un baile en el palacio.", f"{W}/6/6a/Cinderella_-_Project_Gutenberg_eText_14251.jpg", "Princesas"),
        ("Ricitos de Oro", "Una niña y tres osos en el bosque.", f"{W}/b/b3/Goldilocks_and_the_Three_Bears_-_Project_Gutenberg_eText_17034.jpg", "Clásicos"),
        ("El Patito Feo", "Un patito diferente que se convierte en cisne.", f"{W}/4/4f/The_Ugly_Duckling_-_Milo_Winter.jpg", "Animales"),
        ("Pinocho", "Un muñeco de madera que quiere ser niño de verdad.", f"{W}/2/24/Pinocchio.jpg", "Fantasía"),
        ("La Bella Durmiente", "Un hechizo de sueño y un beso de amor.", f"{W}/e/e0/THE_SLEEPING_BEAUTY.PNG", "Princesas"),
    ]
    extra = [
        ("El Gato con Botas", "Un gato listo ayuda a su dueño.", DEFAULT_COVER, "Clásicos"),
        ("La Ratita Presumida", "Una ratita busca el novio perfecto.", DEFAULT_COVER, "Animales"),
        ("Los Músicos de Bremen", "Cuatro amigos van a tocar a Bremen.", DEFAULT_COVER, "Clásicos"),
        ("La Princesa y el Guisante", "Una princesa muy sensible.", DEFAULT_COVER, "Princesas"),
        ("El Traje Nuevo del Emperador", "Un emperador y un traje invisible.", DEFAULT_COVER, "Fábulas"),
        ("La Liebre y la Tortuga", "La tortuga gana con paciencia.", DEFAULT_COVER, "Fábulas"),
        ("El León y el Ratón", "Un ratón ayuda a un león.", DEFAULT_COVER, "Fábulas"),
        ("La Cigarra y la Hormiga", "La hormiga trabaja en verano.", DEFAULT_COVER, "Fábulas"),
        ("El Zorro y la Cigüeña", "No hagas a otros lo que no quieras para ti.", DEFAULT_COVER, "Fábulas"),
        ("La Gallina de los Huevos de Oro", "Un granjero y una gallina especial.", DEFAULT_COVER, "Fábulas"),
        ("El Pastorcito Mentiroso", "Quien miente no es creído.", DEFAULT_COVER, "Fábulas"),
        ("La Bella y la Bestia", "El amor transforma el corazón.", DEFAULT_COVER, "Princesas"),
        ("Rapunzel", "Una princesa en una torre.", DEFAULT_COVER, "Princesas"),
        ("Los Siete Cabritillos", "Una cabra y sus hijos frente al lobo.", DEFAULT_COVER, "Clásicos"),
        ("Pulgarcio", "Un niño tan pequeño como un pulgar.", DEFAULT_COVER, "Aventuras"),
        ("El Enano Saltarín", "Quién sabe tu nombre tiene poder.", DEFAULT_COVER, "Fantasía"),
        ("El Sastrecillo Valiente", "Siete de un golpe.", DEFAULT_COVER, "Aventuras"),
        ("Peter Pan", "El niño que no quería crecer.", DEFAULT_COVER, "Fantasía"),
        ("Dumbo", "Un elefante con orejas grandes.", DEFAULT_COVER, "Animales"),
        ("El Flautista de Hamelín", "La música que llevó a las ratas lejos.", DEFAULT_COVER, "Clásicos"),
        ("El Mago de Oz", "Dorothy y sus amigos en Oz.", DEFAULT_COVER, "Fantasía"),
        ("Alicia en el País de las Maravillas", "Una niña en un mundo mágico.", DEFAULT_COVER, "Fantasía"),
        ("Heidi", "Una niña en los Alpes.", DEFAULT_COVER, "Aventuras"),
        ("El Principito", "Un principito y una rosa.", DEFAULT_COVER, "Fantasía"),
        ("El León Cobarde", "El león que buscaba valor.", DEFAULT_COVER, "Fábulas"),
        ("El Árbol Generoso", "Un árbol que lo da todo.", DEFAULT_COVER, "Infantiles"),
        ("La Pequeña Oruga Glotona", "Una oruga que come y come.", DEFAULT_COVER, "Infantiles"),
        ("Elmer el Elefante", "Un elefante de muchos colores.", DEFAULT_COVER, "Animales"),
        ("Donde Viven los Monstruos", "Max y los monstruos.", DEFAULT_COVER, "Fantasía"),
        ("Adivina Cuánto Te Quiero", "Liebre y su pequeño.", DEFAULT_COVER, "Infantiles"),
        ("El Ratón de Campo y el de Ciudad", "Dos ratones y dos vidas.", DEFAULT_COVER, "Fábulas"),
        ("El Zorro y las Uvas", "Las uvas estaban verdes.", DEFAULT_COVER, "Fábulas"),
        ("La Lechera", "Soñar despierto a veces duele.", DEFAULT_COVER, "Fábulas"),
        ("El Perro y su Reflejo", "El perro y el hueso en el agua.", DEFAULT_COVER, "Fábulas"),
        ("La Zorra y el Cuervo", "El queso y el cumplido.", DEFAULT_COVER, "Fábulas"),
        ("El Príncipe Feliz", "Una estatua que da todo.", DEFAULT_COVER, "Fantasía"),
        ("El Gigante Egoísta", "Un jardín que se abre al compartir.", DEFAULT_COVER, "Fantasía"),
        ("El Ruiseñor y la Rosa", "Un ruiseñor canta por amor.", DEFAULT_COVER, "Fantasía"),
        ("La Princesa y el Sapo", "Un beso que lo cambia todo.", DEFAULT_COVER, "Princesas"),
        ("El Rey Midas", "Todo lo que tocaba se volvía oro.", DEFAULT_COVER, "Fábulas"),
        ("La Caja de Pandora", "Al final quedó la esperanza.", DEFAULT_COVER, "Fábulas"),
        ("El Caballo Alado", "Pegaso y el héroe.", DEFAULT_COVER, "Fantasía"),
        ("La Llave Dorada", "Un niño encuentra una llave mágica.", DEFAULT_COVER, "Aventuras"),
        ("El Unicornio Perdido", "Un unicornio busca su bosque.", DEFAULT_COVER, "Fantasía"),
        ("La Bruja Buena", "Una bruja que ayuda a los niños.", DEFAULT_COVER, "Fantasía"),
        ("El Hada del Bosque", "Un hada que cumple deseos.", DEFAULT_COVER, "Fantasía"),
        ("El Duende del Jardín", "Un duende que cuida las flores.", DEFAULT_COVER, "Fantasía"),
        ("La Nube que Llovía Caramelos", "Un pueblo y una nube especial.", DEFAULT_COVER, "Fantasía"),
        ("El Rey que Quería la Luna", "Un rey pide la luna.", DEFAULT_COVER, "Fábulas"),
        ("La Princesa que Bostezaba", "Una princesa que solo bostezaba.", DEFAULT_COVER, "Princesas"),
        ("El Dragón que No Escupía Fuego", "Un dragón que prefería flores.", DEFAULT_COVER, "Fantasía"),
        ("El País de los Juguetes", "Donde los juguetes cobran vida.", DEFAULT_COVER, "Fantasía"),
        ("La Isla del Tesoro", "Jim y el mapa del tesoro.", DEFAULT_COVER, "Aventuras"),
        ("Robin Hood", "El que robaba a los ricos.", DEFAULT_COVER, "Aventuras"),
        ("Guillermo Tell", "La manzana en la cabeza.", DEFAULT_COVER, "Aventuras"),
        ("Simbad el Marino", "Un marinero y sus viajes.", DEFAULT_COVER, "Aventuras"),
        ("Alí Babá", "Abrete sésamo.", DEFAULT_COVER, "Aventuras"),
        ("Aladino", "La lámpara maravillosa.", DEFAULT_COVER, "Fantasía"),
        ("El Libro de la Selva", "Mowgli y los animales.", DEFAULT_COVER, "Animales"),
        ("Mary Poppins", "Una niñera mágica.", DEFAULT_COVER, "Fantasía"),
        ("Winnie Pooh", "Un oso y su tarro de miel.", DEFAULT_COVER, "Animales"),
        ("La Telaraña de Carlota", "Un cerdito y una araña amiga.", DEFAULT_COVER, "Animales"),
        ("Stuart Little", "Un ratón en la familia.", DEFAULT_COVER, "Animales"),
        ("El Viento en los Sauces", "Topo, Rata y sus amigos.", DEFAULT_COVER, "Animales"),
        ("Buenas Noches Luna", "Decir buenas noches a todo.", DEFAULT_COVER, "Infantiles"),
        ("El Monstruo de Colores", "Un monstruo que no sabe qué siente.", DEFAULT_COVER, "Infantiles"),
        ("El Niño y los Dulces", "No ser goloso.", DEFAULT_COVER, "Fábulas"),
        ("La Hormiga y la Paloma", "La paloma ayuda a la hormiga.", DEFAULT_COVER, "Fábulas"),
        ("El Caballo y el Asno", "Compartir la carga.", DEFAULT_COVER, "Fábulas"),
        ("El Lobo con Piel de Oveja", "El lobo se disfrazó.", DEFAULT_COVER, "Fábulas"),
        ("La Princesa y el Dragón", "Un dragón que quería ser amigo.", DEFAULT_COVER, "Princesas"),
        ("El Tesoro Escondido", "Un niño encuentra un cofre.", DEFAULT_COVER, "Aventuras"),
        ("Las Tres Plumas", "El hijo menor y las plumas.", DEFAULT_COVER, "Fantasía"),
        ("El Pescador y su Mujer", "Una mujer que pide demasiado.", DEFAULT_COVER, "Fábulas"),
        ("El Ganso de Oro", "Un ganso que se pega a la gente.", DEFAULT_COVER, "Fábulas"),
        ("Juan el Simple", "El más tonto que triunfa.", DEFAULT_COVER, "Fábulas"),
        ("El Lobo y las Siete Cabritas", "La mamá cabra rescata a sus hijas.", DEFAULT_COVER, "Clásicos"),
        ("La Casita de Chocolate", "Otra casita dulce en el bosque.", DEFAULT_COVER, "Aventuras"),
        ("El Niño de las Estrellas", "Un niño que brilla como las estrellas.", DEFAULT_COVER, "Fantasía"),
        ("La Flor de la Alegría", "Una flor que hace reír.", DEFAULT_COVER, "Infantiles"),
        ("El Caracol que Quería Volar", "Un caracol con un sueño.", DEFAULT_COVER, "Animales"),
        ("La Mariposa y la Luz", "Una mariposa busca el sol.", DEFAULT_COVER, "Animales"),
        ("El Pez Arcoíris", "El pez que compartió sus escamas.", DEFAULT_COVER, "Animales"),
        ("La Oveja que Soñaba", "Una oveja que soñaba con el cielo.", DEFAULT_COVER, "Animales"),
        ("El Conejo Blanco", "Un conejo que siempre llega tarde.", DEFAULT_COVER, "Fantasía"),
        ("La Tortuga que Ganó la Carrera", "Paciencia y constancia.", DEFAULT_COVER, "Fábulas"),
        ("El Pájaro de Fuego", "Un pájaro que brilla.", DEFAULT_COVER, "Fantasía"),
        ("El Puente de Piedra", "Un puente que construyeron entre todos.", DEFAULT_COVER, "Fábulas"),
        ("La Fuente de los Deseos", "Una fuente que cumple un deseo.", DEFAULT_COVER, "Fantasía"),
        ("El Árbol de los Abrazos", "Un árbol donde todos se abrazan.", DEFAULT_COVER, "Infantiles"),
    ]
    return base + extra


def get_escena_textos():
    """100 cuentos con 5 escenas cada uno. Lenguaje suave para niños."""
    return (
        [
            _caperucita(),
            _tres_cerditos(),
            _sirenita(),
            _blancanieves(),
            _hansel_gretel(),
            _cenicienta(),
            _ricitos(),
            _patito_feo(),
            _pinocho(),
            _bella_durmiente(),
        ]
        + _get_extra_escenas()
    )


def _get_extra_escenas():
    """90 cuentos más, 5 escenas cada uno. Textos breves y suaves."""
    return [
        _escenas_5("El Gato con Botas", "molinero", "gato", "botas", "rey", "castillo"),
        _escenas_5("La Ratita Presumida", "ratita", "barredora", "novios", "gato", "casa"),
        _escenas_5("Los Músicos de Bremen", "burro", "perro", "gato", "gallo", "Bremen"),
        _escenas_5("La Princesa y el Guisante", "príncipe", "princesas", "guisante", "colchones", "boda"),
        _escenas_5("El Traje Nuevo del Emperador", "emperador", "tejedores", "traje", "desfile", "niño"),
        _escenas_5("La Liebre y la Tortuga", "liebre", "tortuga", "carrera", "meta", "victoria"),
        _escenas_5("El León y el Ratón", "león", "ratón", "red", "mordisco", "amigos"),
        _escenas_5("La Cigarra y la Hormiga", "verano", "cigarra", "hormiga", "invierno", "compartir"),
        _escenas_5("El Zorro y la Cigüeña", "zorro", "cigüeña", "comida", "recipiente", "lección"),
        _escenas_5("La Gallina de los Huevos de Oro", "granjero", "gallina", "huevos", "avaro", "arrepentido"),
        _escenas_5("El Pastorcito Mentiroso", "pastor", "lobo", "grito", "aldeanos", "verdad"),
        _escenas_5("La Bella y la Bestia", "príncipe", "bestia", "rosa", "Bella", "amor"),
        _escenas_5("Rapunzel", "torre", "Rapunzel", "pelo", "príncipe", "libertad"),
        _escenas_5("Los Siete Cabritillos", "mamá cabra", "lobo", "cabritillos", "reloj", "rescate"),
        _escenas_5("Pulgarcio", "pulgar", "viaje", "vaca", "ratón", "familia"),
        _escenas_5("El Enano Saltarín", "molinera", "enano", "nombre", "adivinar", "feliz"),
        _escenas_5("El Sastrecillo Valiente", "moscas", "siete", "gigante", "rey", "princesa"),
        _escenas_5("Peter Pan", "Wendy", "Peter", "Campanilla", "Nunca Jamás", "volar"),
        _escenas_5("Dumbo", "elefante", "orejas", "plumas", "volar", "circo"),
        _escenas_5("El Flautista de Hamelín", "ratas", "flautista", "música", "niños", "pueblo"),
        _escenas_5("El Mago de Oz", "Dorothy", "espantapájaros", "león", "bruja", "zapatos"),
        _escenas_5("Alicia en el País de las Maravillas", "conejo", "Alicia", "té", "reina", "despertar"),
        _escenas_5("Heidi", "Alpes", "abuelo", "Peter", "Clara", "montaña"),
        _escenas_5("El Principito", "asteroide", "rosa", "planetas", "zorro", "estrella"),
        _escenas_5("El León Cobarde", "león", "valor", "magia", "pruebas", "valiente"),
        _escenas_5("El Árbol Generoso", "árbol", "niño", "manzanas", "sombra", "amor"),
        _escenas_5("La Pequeña Oruga Glotona", "huevo", "oruga", "comida", "capullo", "mariposa"),
        _escenas_5("Elmer el Elefante", "Elmer", "colores", "manada", "broma", "felicidad"),
        _escenas_5("Donde Viven los Monstruos", "Max", "barco", "monstruos", "rey", "casa"),
        _escenas_5("Adivina Cuánto Te Quiero", "liebre grande", "liebre pequeña", "brazos", "saltos", "luna"),
        _escenas_5("El Ratón de Campo y el de Ciudad", "campo", "ciudad", "visita", "comida", "hogar"),
        _escenas_5("El Zorro y las Uvas", "zorro", "uvas", "salto", "verdes", "marcha"),
        _escenas_5("La Lechera", "lechera", "cántaro", "sueños", "tropezón", "realidad"),
        _escenas_5("El Perro y su Reflejo", "perro", "puente", "hueso", "reflejo", "agua"),
        _escenas_5("La Zorra y el Cuervo", "cuervo", "queso", "zorra", "canto", "complemento"),
        _escenas_5("El Príncipe Feliz", "estatua", "golondrina", "oro", "pobres", "cielo"),
        _escenas_5("El Gigante Egoísta", "jardín", "gigante", "niños", "invierno", "primavera"),
        _escenas_5("El Ruiseñor y la Rosa", "estudiante", "rosa", "ruiseñor", "canto", "amor"),
        _escenas_5("La Princesa y el Sapo", "sapo", "princesa", "beso", "príncipe", "baile"),
        _escenas_5("El Rey Midas", "Midas", "toque", "oro", "hija", "arrepentimiento"),
        _escenas_5("La Caja de Pandora", "Pandora", "caja", "curiosidad", "abrir", "esperanza"),
        _escenas_5("El Caballo Alado", "Pegaso", "héroe", "vuelo", "montaña", "amigos"),
        _escenas_5("La Llave Dorada", "niño", "nieve", "llave", "cofre", "sorpresa"),
        _escenas_5("El Unicornio Perdido", "unicornio", "bosque", "niña", "camino", "regreso"),
        _escenas_5("La Bruja Buena", "bruja", "niños", "pócima", "ayuda", "gracias"),
        _escenas_5("El Hada del Bosque", "hada", "niño", "deseo", "flores", "risa"),
        _escenas_5("El Duende del Jardín", "duende", "flores", "riego", "semillas", "jardín"),
        _escenas_5("La Nube que Llovía Caramelos", "pueblo", "nube", "caramelos", "niños", "fiesta"),
        _escenas_5("El Rey que Quería la Luna", "rey", "luna", "sabios", "niña", "reflejo"),
        _escenas_5("La Princesa que Bostezaba", "princesa", "bostezo", "médicos", "payaso", "risa"),
        _escenas_5("El Dragón que No Escupía Fuego", "dragón", "flores", "niños", "juego", "amigos"),
        _escenas_5("El País de los Juguetes", "niño", "juguetes", "vida", "baile", "sueño"),
        _escenas_5("La Isla del Tesoro", "Jim", "mapa", "barco", "isla", "aventura"),
        _escenas_5("Robin Hood", "Robin", "pobres", "rico", "flecha", "justicia"),
        _escenas_5("Guillermo Tell", "Tell", "manzana", "hijo", "flecha", "libertad"),
        _escenas_5("Simbad el Marino", "Simbad", "barco", "isla", "viaje", "regreso"),
        _escenas_5("Alí Babá", "Alí", "sésamo", "cueva", "tesoro", "familia"),
        _escenas_5("Aladino", "Aladino", "lámpara", "genio", "princesa", "palacio"),
        _escenas_5("El Libro de la Selva", "Mowgli", "lobos", "Bagheera", "Baloo", "selva"),
        _escenas_5("Mary Poppins", "Mary", "paraguas", "niños", "magia", "cantar"),
        _escenas_5("Winnie Pooh", "Pooh", "miel", "Tigre", "Eeyore", "bosque"),
        _escenas_5("La Telaraña de Carlota", "Wilbur", "Carlota", "web", "feria", "amigos"),
        _escenas_5("Stuart Little", "Stuart", "familia", "ratón", "aventura", "casa"),
        _escenas_5("El Viento en los Sauces", "Topo", "Rata", "río", "Toad", "pícnic"),
        _escenas_5("Buenas Noches Luna", "conejo", "habitación", "luna", "buenas noches", "sueño"),
        _escenas_5("El Monstruo de Colores", "monstruo", "colores", "rabia", "alegría", "calma"),
        _escenas_5("El Niño y los Dulces", "niño", "dulces", "mano", "tarro", "paciencia"),
        _escenas_5("La Hormiga y la Paloma", "hormiga", "agua", "paloma", "hoja", "amigos"),
        _escenas_5("El Caballo y el Asno", "caballo", "asno", "carga", "compartir", "camino"),
        _escenas_5("El Lobo con Piel de Oveja", "lobo", "disfraz", "rebaño", "pastor", "huida"),
        _escenas_5("La Princesa y el Dragón", "princesa", "dragón", "amistad", "castillo", "fiesta"),
        _escenas_5("El Tesoro Escondido", "niño", "mapa", "cofre", "jardín", "sorpresa"),
        _escenas_5("Las Tres Plumas", "rey", "hijo", "plumas", "anillo", "corona"),
        _escenas_5("El Pescador y su Mujer", "pescador", "pez", "mujer", "deseos", "cabaña"),
        _escenas_5("El Ganso de Oro", "ganso", "pegamento", "rey", "princesa", "risa"),
        _escenas_5("Juan el Simple", "Juan", "tonto", "reina", "pruebas", "suerte"),
        _escenas_5("El Lobo y las Siete Cabritas", "cabritas", "lobo", "mamá", "barriga", "piedras"),
        _escenas_5("La Casita de Chocolate", "niños", "bosque", "casita", "dulces", "familia"),
        _escenas_5("El Niño de las Estrellas", "niño", "brillo", "estrellas", "pueblo", "noche"),
        _escenas_5("La Flor de la Alegría", "flor", "risa", "jardín", "niños", "alegría"),
        _escenas_5("El Caracol que Quería Volar", "caracol", "alas", "pájaro", "viento", "sueño"),
        _escenas_5("La Mariposa y la Luz", "mariposa", "sol", "flores", "vuelo", "luz"),
        _escenas_5("El Pez Arcoíris", "pez", "escamas", "compartir", "amigos", "feliz"),
        _escenas_5("La Oveja que Soñaba", "oveja", "cielo", "nubes", "rebaño", "campo"),
        _escenas_5("El Conejo Blanco", "conejo", "reloj", "Alicia", "madriguera", "tarde"),
        _escenas_5("La Tortuga que Ganó la Carrera", "tortuga", "liebre", "meta", "constancia", "victoria"),
        _escenas_5("El Pájaro de Fuego", "pájaro", "plumas", "brillo", "príncipe", "bosque"),
        _escenas_5("El Puente de Piedra", "río", "puente", "vecinos", "trabajo", "juntos"),
        _escenas_5("La Fuente de los Deseos", "fuente", "deseo", "moneda", "sueño", "cumplido"),
        _escenas_5("El Árbol de los Abrazos", "árbol", "abrazos", "familia", "sombra", "amor"),
    ]


def _escenas_5(titulo, a, b, c, d, e):
    """Genera 5 escenas suaves para un cuento a partir de palabras clave."""
    return [
        f"Érase una vez algo relacionado con {a}. Todo empezó en un lugar muy bonito.",
        f"Un día apareció {b} y las cosas cambiaron. Había que ser valiente y amable.",
        f"Pasó algo con {c} y todos aprendieron una lección. La amistad es importante.",
        f"Después vino {d} y todo se arregló. Los buenos siempre encuentran ayuda.",
        f"Al final {e} hizo que todos fueran felices. Y colorín colorado este cuento se ha acabado.",
    ]


def get_preguntas_seed():
    """100 listas de 3 preguntas cada una. Las primeras 10 son específicas; el resto genéricas."""
    base = [
        [{"p": "¿A quién iba a visitar Caperucita?", "opciones": ["Al lobo", "A su abuelita", "Al leñador", "A su madre"], "correcta": 1}, {"p": "¿Quién salvó a Caperucita?", "opciones": ["El lobo", "La abuela", "Un leñador", "Su madre"], "correcta": 2}, {"p": "¿Qué llevaba Caperucita en la cesta?", "opciones": ["Flores", "Pan y miel", "Dulces", "Nada"], "correcta": 1}],
        [{"p": "¿De qué material era la casa más fuerte?", "opciones": ["Paja", "Madera", "Ladrillo", "Piedra"], "correcta": 2}, {"p": "¿Quién quería molestar a los cerditos?", "opciones": ["Un oso", "Un lobo", "Un zorro", "Un leñador"], "correcta": 1}, {"p": "¿Cuántos cerditos había?", "opciones": ["Uno", "Dos", "Tres", "Cuatro"], "correcta": 2}],
        [{"p": "¿Cómo se llamaba la sirenita?", "opciones": ["Úrsula", "Ariel", "Flounder", "Tritón"], "correcta": 1}, {"p": "¿Qué quería tener para estar con el príncipe?", "opciones": ["Alas", "Piernas", "Una corona", "Un barco"], "correcta": 1}, {"p": "¿Quién ayudó a Ariel?", "opciones": ["Su padre", "La bruja del mar", "El príncipe", "Un pez"], "correcta": 1}],
        [{"p": "¿Cuántos enanitos acogieron a Blancanieves?", "opciones": ["Cinco", "Seis", "Siete", "Ocho"], "correcta": 2}, {"p": "¿Qué le dio la reina para dormirla?", "opciones": ["Un pastel", "Una manzana", "Una pócima", "Un hechizo"], "correcta": 1}, {"p": "¿Quién despertó a Blancanieves?", "opciones": ["Un enanito", "Un cazador", "Un príncipe", "El espejo"], "correcta": 2}],
        [{"p": "¿Qué encontraron en el bosque?", "opciones": ["Una cabaña", "Una casita de dulces", "Un castillo", "Un río"], "correcta": 1}, {"p": "¿Quién era la anciana de la casita?", "opciones": ["Un hada", "Una bruja", "La abuela", "Una vecina"], "correcta": 1}, {"p": "¿Qué usó Hansel la primera vez?", "opciones": ["Piedras", "Migas de pan", "Ramas", "Hojas"], "correcta": 0}],
        [{"p": "¿Qué convirtió el hada en carroza?", "opciones": ["Una sandía", "Una calabaza", "Una manzana", "Un melón"], "correcta": 1}, {"p": "¿Qué perdió Cenicienta al salir?", "opciones": ["El vestido", "Un guante", "Un zapatito de cristal", "La corona"], "correcta": 2}, {"p": "¿A qué hora todo volvía a su forma?", "opciones": ["A las diez", "A las once", "A medianoche", "Al amanecer"], "correcta": 2}],
        [{"p": "¿Cuántos osos vivían en la casita?", "opciones": ["Uno", "Dos", "Tres", "Cuatro"], "correcta": 2}, {"p": "¿Qué probó Ricitos en la mesa?", "opciones": ["Pan", "Sopa", "Tarta", "Leche"], "correcta": 1}, {"p": "¿En qué cama se quedó dormida?", "opciones": ["La grande", "La mediana", "La pequeña", "En el suelo"], "correcta": 2}],
        [{"p": "¿Qué era en realidad el patito feo?", "opciones": ["Un pato", "Un cisne", "Una gallina", "Un ganso"], "correcta": 1}, {"p": "¿Dónde lo descubrió?", "opciones": ["En el corral", "En el lago al verse", "En el bosque", "En la granja"], "correcta": 1}, {"p": "¿Qué estación era cuando vio a los cisnes?", "opciones": ["Invierno", "Primavera", "Verano", "Otoño"], "correcta": 1}],
        [{"p": "¿Qué le crecía a Pinocho al mentir?", "opciones": ["Las orejas", "La nariz", "Los pies", "El pelo"], "correcta": 1}, {"p": "¿Quién creó a Pinocho?", "opciones": ["El hada", "Geppetto", "El zorro", "La ballena"], "correcta": 1}, {"p": "¿Dónde encontró a su padre?", "opciones": ["En el colegio", "En el bosque", "En una ballena", "En el mar"], "correcta": 2}],
        [{"p": "¿Cómo se llamaba la princesa?", "opciones": ["Blancanieves", "Aurora", "Cenicienta", "Ariel"], "correcta": 1}, {"p": "¿Con qué se pinchó?", "opciones": ["Una aguja", "Una espada", "Una rueca", "Un cuchillo"], "correcta": 2}, {"p": "¿Qué la despertó?", "opciones": ["Un hada", "Un beso de amor", "El rey", "Un príncipe"], "correcta": 1}],
    ]
    generic = [
        {"p": "¿Cómo termina el cuento?", "opciones": ["Todos felices", "Con una fiesta", "Con un viaje", "Con una sorpresa"], "correcta": 0},
        {"p": "¿Qué es lo más importante en la historia?", "opciones": ["La amistad", "La valentía", "La bondad", "Todas"], "correcta": 3},
        {"p": "¿Cuántas escenas tiene este cuento?", "opciones": ["Tres", "Cuatro", "Cinco", "Seis"], "correcta": 2},
    ]
    return base + [generic] * 90


def _caperucita():
    return [
        "Érase una vez una niña a la que todos llamaban Caperucita Roja porque llevaba una capa roja. Vivía con su madre en una casita al borde del bosque. Un día su madre le preparó una cesta con pan y miel para su abuelita, que estaba enferma. Le dijo que no se entretuviera ni hablara con desconocidos.",
        "Caperucita cogió la cesta y fue por el sendero del bosque. Recogió flores para su abuela. Apareció un lobo astuto que le preguntó adónde iba. Ella le contó que iba a casa de su abuelita. El lobo le sugirió que recogiera más flores y tomó un atajo.",
        "El lobo llegó antes a casa de la abuela. La abuelita se escondió en el armario y el lobo se puso su gorro y su camisón y se metió en la cama. Cuando Caperucita llegó, entró y se acercó a la cama extrañada de ver a su abuela con tan extraño aspecto.",
        "Caperucita dijo: Abuelita, qué orejas tan grandes tienes. Para oírte mejor. Y qué ojos tan grandes. Para verte mejor. Y qué boca tan grande. ¡Para darte un abrazo mejor! El lobo se abalanzó pero en ese momento entró un leñador que había oído voces.",
        "El leñador asustó al lobo y este salió corriendo del bosque. Abrieron el armario y sacaron a la abuelita, que estaba bien. Caperucita aprendió a no hablar con desconocidos y a no apartarse del camino. Las tres se sentaron a merendar juntas.",
    ]


def _tres_cerditos():
    return [
        "Había una vez tres cerditos que decidieron construir cada uno su casa. El primero hizo la suya de paja muy rápido y se puso a tocar la flauta. El segundo la hizo de madera y fue a jugar. El tercero trabajó mucho y la hizo de ladrillos, con chimenea y puerta fuerte.",
        "Un lobo apareció por la zona. Fue a la casa de paja, llamó y como no abrieron sopló con fuerza y la casa se vino abajo. El primer cerdito escapó y se refugió en la casa de madera de su hermano.",
        "El lobo fue a la casa de madera, sopló y sopló y al final la derribó. Los dos corrieron a la casa de ladrillo y entraron justo a tiempo. El lobo sopló pero la casa no se movió.",
        "El lobo intentó colarse por la chimenea. El tercer cerdito encendió un fuego suave y puso una olla con agua tibia. Cuando el lobo bajó, se mojó y salió corriendo sin hacerse daño.",
        "Los tres cerditos vivieron seguros en la casa de ladrillo. El lobo no volvió a molestarlos y los hermanos jugaban juntos en el jardín.",
    ]


def _sirenita():
    return [
        "En el fondo del mar vivía el rey Tritón con sus hijas. La más joven, Ariel, soñaba con el mundo de los humanos y coleccionaba objetos de los naufragios. Su padre le pedía que no subiera a la superficie, pero ella lo hacía a escondidas con su amigo Flounder.",
        "Una noche Ariel vio un barco con un joven príncipe. Hubo una tormenta y el príncipe cayó al agua. Ariel lo salvó y lo llevó a la orilla cantando. Cuando empezó a despertar ella tuvo que irse; él solo vio una joven que se alejaba.",
        "Ariel quería estar con el príncipe. La bruja del mar le ofreció piernas a cambio de su voz; si en tres días el príncipe no la besaba por amor, volvería al mar. Ariel aceptó. Llegó a la playa con piernas y el príncipe la llevó al castillo.",
        "Úrsula intentó engañar al príncipe con la voz de Ariel. El rey Tritón y el príncipe lo descubrieron y la detuvieron. Recuperaron la voz de Ariel.",
        "El rey Tritón, contento con el amor de su hija, le dio permiso para ser humana. Ariel y el príncipe se casaron y vivieron junto al mar. Ella visitaba a su familia bajo las olas cuando quería.",
    ]


def _blancanieves():
    return [
        "En un reino vivía la princesa Blancanieves, de piel muy blanca y pelo negro. Su madrastra preguntaba cada día al espejo quién era la más bella. Un día el espejo dijo que Blancanieves era la más bella. La reina se puso muy celosa.",
        "La reina pidió a un cazador que llevara a Blancanieves al bosque y la dejara perdida. El cazador la llevó pero no pudo hacerle daño; le dijo que huyera y que no volviera. Blancanieves corrió por el bosque hasta encontrar una casita pequeña.",
        "La casita era de siete enanitos. Blancanieves entró, probó un poco de cada plato y se quedó dormida en una camita. Los enanitos la encontraron y la acogieron. Ella se quedó a vivir con ellos, cocinando y limpiando.",
        "La reina descubrió que Blancanieves seguía viva. Disfrazada de anciana le ofreció una manzana. Blancanieves mordió y cayó en un sueño muy profundo. Los enanitos la pusieron en una cama de cristal en el jardín porque era muy bonita.",
        "Un príncipe que pasaba la vio y se enamoró. Al acercarse para despedirse, la besó en la frente. Blancanieves despertó. La reina se fue del reino y no volvió. Blancanieves y el príncipe se casaron y vivieron felices.",
    ]


def _hansel_gretel():
    return [
        "Hansel y Gretel vivían con su padre y su madrastra en una cabaña. Pasaban mucha necesidad. La madrastra convenció al padre de llevar a los niños al bosque para que encontraran bayas. Hansel oyó la conversación y recogió piedrecitas blancas.",
        "Al día siguiente los llevaron al bosque. Hansel fue dejando piedrecitas. Cuando anocheció, la luna iluminó las piedras y encontraron el camino a casa. A la semana siguiente Hansel solo pudo usar migas; los pájaros se las comieron y se perdieron.",
        "Caminaron hasta ver una casita de dulces y pastel. Una anciana los invitó a entrar y les dio de comer. En realidad era una bruja que quería tenerlos trabajando para ella. Los encerró y les pidió que ayudaran en la cocina.",
        "La bruja quería que Hansel engordara. Él sacaba un palo por la reja y la bruja, que veía poco, creía que seguía flaco. Un día Gretel la convenció de asomarse al horno para ver si estaba listo.",
        "Gretel cerró la puerta del horno con cuidado y la bruja quedó atrapada un rato. Los niños salieron y encontraron un cofre con monedas. Volvieron a casa; su padre estaba solo y los abrazó. Nunca más pasaron hambre.",
    ]


def _cenicienta():
    return [
        "Cenicienta vivía con su madrastra y sus hermanastras, que la hacían trabajar mucho. Dormía en la buhardilla. A pesar de todo era bondadosa y soñaba con una vida mejor.",
        "El rey organizó un gran baile. Las hermanastras se vistieron de gala y se burlaron de Cenicienta. Su hada madrina apareció y convirtió una calabaza en carroza y sus harapos en vestido de cristal. Le dijo que a medianoche todo volvería a su forma.",
        "Cenicienta llegó al baile y el príncipe no apartó los ojos de ella. Bailaron toda la noche. Al dar las doce Cenicienta salió corriendo y perdió un zapatito de cristal. El príncipe lo recogió y juró encontrar a su dueña.",
        "El príncipe hizo probar el zapato a todas las jóvenes. En casa de Cenicienta las hermanastras probaron sin éxito. El príncipe preguntó si había otra joven; Cenicienta bajó de la buhardilla.",
        "Cenicienta se calzó el zapatito y sacó el otro. El hada la vistió de nuevo. El príncipe la reconoció. Se casaron y Cenicienta perdonó a su familia. Vivieron felices para siempre.",
    ]


def _ricitos():
    return [
        "Tres osos vivían en el bosque: papá oso, mamá osa y osito. Una mañana prepararon tres tazones de sopa y salieron a pasear mientras se enfriaba. Cerca vivía Ricitos de Oro, que ese día se alejó y encontró la casita.",
        "Ricitos llamó y al no responder entró. Vio tres tazones: probó el grande (muy caliente), el mediano (muy frío) y el pequeño (perfecto) y se lo comió. Subió y vio tres camas.",
        "Probó la cama grande (muy dura), la mediana (muy blanda) y la pequeña (tan cómoda que se quedó dormida). Los osos volvieron y vieron los tazones y las camas revueltos.",
        "El osito dijo: ¡Alguien ha estado en mi cama y aquí está! Ricitos se despertó y vio a los tres osos. Se asustó un poco pero los osos sonrieron.",
        "Ricitos pidió perdón y salió por la ventana hacia el jardín. Los osos la despidieron con un adiós. Desde entonces no entró en casas ajenas sin permiso.",
    ]


def _patito_feo():
    return [
        "En una granja nació un patito más grande y gris que sus hermanos. Los demás lo llamaban el patito feo y se reían. La mamá pata lo quería igual. Él se sentía triste.",
        "Se marchó y pasó el otoño y el invierno solo junto a un pantano, escondido entre los juncos. Cuando llegó la primavera voló hasta un estanque y vio unos cisnes muy bonitos.",
        "Se acercó con miedo. Los cisnes lo rodearon con cariño. El patito feo se asomó al agua y vio su reflejo: ya era un cisne blanco. Había crecido y se había transformado.",
        "Los cisnes lo recibieron como a uno más. Los niños que pasaban decían: ¡Mira, el cisne nuevo es el más bello! El que había sido el patito feo estaba muy feliz.",
        "Nunca hay que burlarse de quien es diferente. Cada uno tiene su momento de convertirse en quien está destinado a ser.",
    ]


def _pinocho():
    return [
        "Geppetto era un carpintero que no tenía hijos. Talló un muñeco de madera llamado Pinocho. Un hada azul le dio vida y le dijo que sería un niño de verdad si era valiente y sincero. Dejó a Pepito Grillo como su conciencia.",
        "Pinocho fue al colegio pero se dejó engañar y acabó en un teatro. Cuando mentía le crecía la nariz. El hada lo perdonó. Geppetto salió a buscarlo y fue a parar dentro de una ballena grande.",
        "Pinocho entró en la ballena y encontró a Geppetto. Para salir hicieron una fogata; el humo hizo estornudar a la ballena y los expulsó al mar. Nadaron hasta la orilla.",
        "En casa Geppetto estaba muy cansado. Pinocho lo cuidó día y noche. Demostró que era valiente y sincero.",
        "El hada premió a Pinocho convirtiéndolo en un niño de verdad. Geppetto y Pepito Grillo estaban muy contentos. La honestidad y el amor hacen que los sueños se cumplan.",
    ]


def _bella_durmiente():
    return [
        "El rey y la reina celebraron el nacimiento de Aurora. Invitaron a las hadas; cada una le dio un don. La bruja Maléfica no fue invitada y lanzó un hechizo: la princesa se pincharía con una rueca y dormiría hasta un beso de amor verdadero. Una hada suavizó el hechizo para que no fuera para siempre.",
        "El rey mandó esconder todas las ruecas. Las hadas llevaron a Aurora al bosque con el nombre de Rosa. Allí creció feliz y un día conoció al príncipe Felipe sin saber que estaban prometidos.",
        "El día de sus dieciséis años Aurora volvió al castillo. Encontró una rueca, tocó el huso y se pinchó. Cayó en un sueño profundo y todo el reino se durmió. Maléfica intentó que el príncipe no llegara.",
        "Felipe escapó con la ayuda de las hadas. Llegó al castillo y venció los obstáculos. Maléfica se desvaneció y las espinas se abrieron.",
        "Felipe besó a Aurora y ella despertó. Todo el reino despertó con ella. Se casaron y vivieron felices para siempre.",
    ]

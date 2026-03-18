# -*- coding: utf-8 -*-
"""Cuentos clásicos reales adaptados a 5 escenas para cuentos.json."""

def get_mejoras():
    """Devuelve un diccionario titulo -> { descripcion, escenas, preguntas }."""
    return {
        "El Gato con Botas": {
            "descripcion": "Un gato astuto convierte la herencia de su dueño en fortuna y amor. Cuento de Charles Perrault.",
            "escenas": [
                {"orden": 1, "texto": "Un molinero dejó a sus tres hijos el molino, el asno y un gato. El hijo menor solo recibió el gato y estaba muy triste. El gato le pidió una bolsa y unas botas, y le prometió que si confiaba en él, todo cambiaría."},
                {"orden": 2, "texto": "El gato cazó conejos y perdices y se los llevó al rey diciendo que eran regalos del Marqués de Carabás. Así ganó la confianza del rey. Un día supo que el rey pasearía con su hija por la orilla del río."},
                {"orden": 3, "texto": "El gato hizo que su amo se bañara en el río y escondió su ropa. Cuando pasó la carroza del rey, el gato gritó que habían robado al Marqués de Carabás. El rey le dio ropas elegantes al joven y lo invitó a subir con la princesa."},
                {"orden": 4, "texto": "El gato corrió por delante y ordenó a los campesinos que dijeran que todas las tierras eran del Marqués de Carabás. Luego entró en el castillo de un ogro. El ogro se transformó en ratón para presumir y el gato lo atrapó."},
                {"orden": 5, "texto": "El rey llegó al castillo y creyó que todo era del Marqués. El hijo del molinero se casó con la princesa y el gato vivió como un gran señor. La astucia y la lealtad habían cambiado su suerte."},
            ],
            "preguntas": [{"p": "¿Qué heredó el hijo menor del molinero?", "opciones": ["El molino", "El asno", "El gato", "Nada"], "correcta": 2}, {"p": "¿Cómo se hacía llamar el joven ante el rey?", "opciones": ["El molinero", "Marqués de Carabás", "El cazador", "El ogro"], "correcta": 1}, {"p": "¿Qué hizo el gato con el ogro?", "opciones": ["Lo encerró", "Se hizo amigo", "Lo venció cuando se transformó en ratón", "Lo presentó al rey"], "correcta": 2}],
        },
        "La Ratita Presumida": {
            "descripcion": "Una ratita que barre su casita encuentra una moneda y busca con quién casarse. Cuento popular español.",
            "escenas": [
                {"orden": 1, "texto": "Había una vez una ratita muy presumida que vivía en una casita limpia. Un día barriendo encontró una moneda de oro. Decidió guardarla y pensó: me voy a comprar un lazo y buscaré un novio."},
                {"orden": 2, "texto": "Pasó el gallo y le preguntó si quería casarse con él. Ella le preguntó qué haría por la noche. El gallo dijo que cantaría quiquiriquí. La ratita dijo que no, que la despertaría. Lo mismo pasó con el perro y con el cerdo."},
                {"orden": 3, "texto": "Llegó el gato, muy elegante, y le preguntó a la ratita si quería casarse con él. La ratita le preguntó qué haría por la noche. El gato dijo con suavidad: Miau, miau, ronroneando a tu lado. La ratita se enamoró de su voz."},
                {"orden": 4, "texto": "La ratita aceptó y se casó con el gato. Prepararon una fiesta y la ratita estaba muy contenta. Por la noche se fueron a dormir a la casita."},
                {"orden": 5, "texto": "En algunas versiones el gato era bueno y vivieron felices. En otras, la ratita aprendió a no fiarse solo de las palabras. Lo importante es elegir bien y ser amable con todos."},
            ],
            "preguntas": [{"p": "¿Qué encontró la ratita al barrer?", "opciones": ["Un lazo", "Una moneda de oro", "Un anillo", "Un gato"], "correcta": 1}, {"p": "¿Quién quiso casarse maullando suavemente?", "opciones": ["El gallo", "El perro", "El gato", "El cerdo"], "correcta": 2}, {"p": "¿Con cuántos pretendientes habló la ratita?", "opciones": ["Uno", "Dos", "Tres", "Cuatro"], "correcta": 3}],
        },
        "Los Músicos de Bremen": {
            "descripcion": "Un burro, un perro, un gato y un gallo, ya mayores, se unen para ir a Bremen a ser músicos. Cuento de los hermanos Grimm.",
            "escenas": [
                {"orden": 1, "texto": "Un burro que había trabajado mucho para su amo se dio cuenta de que ya no podía cargar. El amo quiso deshacerse de él. El burro escapó y decidió ir a Bremen a ser músico. Por el camino encontró un perro viejo, luego un gato y un gallo, todos en la misma situación."},
                {"orden": 2, "texto": "Los cuatro se hicieron amigos y siguieron el camino a Bremen. Por la noche vieron una casa con luz. Se acercaron y miraron por la ventana: dentro había unos ladrones cenando y contando monedas."},
                {"orden": 3, "texto": "Los animales planearon asustar a los ladrones. Se subieron uno encima del otro: el burro abajo, el perro sobre él, el gato encima y el gallo en lo alto. A una señal, el burro rebuznó, el perro ladró, el gato maulló y el gallo cantó."},
                {"orden": 4, "texto": "Los ladrones creyeron que era un fantasma y salieron corriendo. Los cuatro amigos entraron en la casa, comieron lo que quedaba y se acostaron cada uno en su rincón preferido."},
                {"orden": 5, "texto": "Uno de los ladrones volvió a espiar. El gato le arañó, el perro le mordió, el burro le dio una coz y el gallo lo persiguió. Los ladrones no volvieron. Los cuatro vivieron allí felices y ya no necesitaron ir a Bremen."},
            ],
            "preguntas": [{"p": "¿A qué ciudad querían ir los animales?", "opciones": ["Berlín", "Bremen", "Hamburgo", "Munich"], "correcta": 1}, {"p": "¿Quiénes estaban en la casa con luz?", "opciones": ["Una familia", "Unos ladrones", "Unos músicos", "Nadie"], "correcta": 1}, {"p": "¿Cómo asustaron a los ladrones?", "opciones": ["Con disfraces", "Haciendo ruidos todos a la vez", "Con fuego", "Con una trampa"], "correcta": 1}],
        },
        "La Princesa y el Guisante": {
            "descripcion": "Un príncipe busca una princesa de verdad. Una noche llega una joven empapada y la reina pone a prueba su sensibilidad. Cuento de Hans Christian Andersen.",
            "escenas": [
                {"orden": 1, "texto": "Había una vez un príncipe que quería casarse, pero solo con una princesa de verdad. Viajó por todo el mundo buscándola y siempre encontraba algo que no le convencía. Volvió al castillo muy triste."},
                {"orden": 2, "texto": "Una noche de tormenta alguien llamó a la puerta. Era una joven empapada y sucia que decía ser princesa. La reina no dijo nada; la hizo pasar y preparó una habitación especial para probarla."},
                {"orden": 3, "texto": "La reina puso un guisante en el fondo de la cama y encima veinte colchones y veinte edredones. Así acostaron a la visitante. A la mañana siguiente le preguntaron cómo había dormido."},
                {"orden": 4, "texto": "La joven dijo que había pasado una noche horrible: algo duro le había dejado el cuerpo lleno de cardenales. Solo una princesa de verdad podría ser tan sensible para notar un guisante bajo tantos colchones."},
                {"orden": 5, "texto": "El príncipe se casó con ella, seguros de que era una princesa auténtica. El guisante fue guardado en el museo del reino. Y colorín colorado, este cuento se ha acabado."},
            ],
            "preguntas": [{"p": "¿Qué puso la reina bajo los colchones?", "opciones": ["Una piedra", "Un guisante", "Una corona", "Nada"], "correcta": 1}, {"p": "¿Por qué la princesa no pudo dormir bien?", "opciones": ["Por el ruido", "Porque notó algo duro", "Por el frío", "Por la luz"], "correcta": 1}, {"p": "¿Qué demostraba que era princesa de verdad?", "opciones": ["Su vestido", "Su sensibilidad", "Su corona", "Su carroza"], "correcta": 1}],
        },
        "El Traje Nuevo del Emperador": {
            "descripcion": "Un emperador vanidoso es engañado por dos pillos que dicen tejer un traje que solo los tontos no ven. Cuento de Hans Christian Andersen.",
            "escenas": [
                {"orden": 1, "texto": "Había un emperador que solo pensaba en estrenar trajes nuevos. Dos estafadores llegaron diciendo que tejían una tela maravillosa: invisible para quien fuera tonto o no sirviera para su cargo. El emperador les dio oro e hilo."},
                {"orden": 2, "texto": "Los pillos no tejían nada; fingían trabajar en telares vacíos. El emperador envió a sus ministros a ver el traje. Ninguno veía nada pero todos decían que era precioso para no parecer tontos."},
                {"orden": 3, "texto": "El día del desfile, los estafadores fingieron vestir al emperador con el traje invisible. El emperador salió desnudo a la calle y todo el pueblo aplaudía porque nadie quería ser el único que no viera la tela."},
                {"orden": 4, "texto": "Un niño pequeño gritó: ¡Pero si va en cueros! La gente empezó a susurrar y a reír. El emperador lo oyó y se ruborizó, pero siguió el desfile más digno que pudo."},
                {"orden": 5, "texto": "La mentira se había extendido por miedo a parecer tonto. La valentía del niño que dijo la verdad nos enseña que hay que tener valor para decir lo que vemos, aunque los demás callen."},
            ],
            "preguntas": [{"p": "¿Qué decían que solo los tontos no veían?", "opciones": ["La corona", "El traje", "El palacio", "El oro"], "correcta": 1}, {"p": "¿Quién dijo que el emperador iba desnudo?", "opciones": ["Un ministro", "Un tejedor", "Un niño", "La reina"], "correcta": 2}, {"p": "¿Por qué todos fingían ver el traje?", "opciones": ["Porque era bonito", "Para no parecer tontos", "Por orden del rey", "Porque estaba oscuro"], "correcta": 1}],
        },
        "La Liebre y la Tortuga": {
            "descripcion": "La liebre, muy segura de sí misma, reta a la tortuga a una carrera. La paciencia y la constancia ganan. Fábula de Esopo.",
            "escenas": [
                {"orden": 1, "texto": "Una liebre muy veloz se burlaba de la tortuga por lo lenta que era. La tortuga, tranquila, le propuso una carrera hasta el árbol del camino. La liebre se rió y aceptó: en un salto te gano, dijo."},
                {"orden": 2, "texto": "Sonaron la salida y la liebre salió disparada. En seguida dejó atrás a la tortuga y, tan segura estaba, que se paró a mitad de camino a descansar bajo un árbol."},
                {"orden": 3, "texto": "La tortuga siguió paso a paso, sin parar, avanzando poco a poco. La liebre se quedó dormida pensando que tenía tiempo de sobra."},
                {"orden": 4, "texto": "Cuando la liebre despertó, miró hacia atrás y no vio a la tortuga. Corrió hacia la meta pero ya era tarde: la tortuga había llegado primero y estaba esperándola junto al árbol."},
                {"orden": 5, "texto": "La liebre aprendió que la soberbia y el descuido pueden hacer perder hasta al más rápido. La constancia y el esfuerzo de la tortuga habían ganado la carrera."},
            ],
            "preguntas": [{"p": "¿Quién ganó la carrera?", "opciones": ["La liebre", "La tortuga", "Empataron", "No terminaron"], "correcta": 1}, {"p": "¿Por qué perdió la liebre?", "opciones": ["Porque se lastimó", "Porque se paró y se durmió", "Porque se perdió", "Porque la tortuga hizo trampa"], "correcta": 1}, {"p": "¿Qué nos enseña esta fábula?", "opciones": ["Que hay que ser rápido", "La constancia y el esfuerzo vencen", "Que dormir es malo", "Que las liebres son perezosas"], "correcta": 1}],
        },
        "El León y el Ratón": {
            "descripcion": "Un león deja libre a un ratón; más tarde el ratón le devuelve el favor. Fábula de Esopo.",
            "escenas": [
                {"orden": 1, "texto": "Un león dormía bajo un árbol. Un ratoncillo pasó por ahí y, sin querer, lo despertó. El león lo atrapó con su zarpa y estaba a punto de comérselo. El ratón le suplicó que lo soltara y le dijo: algún día te devolveré el favor."},
                {"orden": 2, "texto": "El león se rió: ¿Tú, tan pequeño, ayudarme a mí? Pero le dio pena y lo dejó ir. El ratón corrió agradecido y el león siguió su vida."},
                {"orden": 3, "texto": "Días después, unos cazadores tendieron una red en el bosque y el león cayó en la trampa. No podía salir por más que forcejeaba. Rugió con rabia y con miedo."},
                {"orden": 4, "texto": "El ratón oyó los rugidos y reconoció la voz del león. Fue hasta la red y con sus dientecillos empezó a roer las cuerdas. Trabajó sin parar hasta que abrió un agujero."},
                {"orden": 5, "texto": "El león salió libre. Nunca más dudó de que un favor, por pequeño que sea, puede devolverse cuando menos lo esperas. Los dos se despidieron como amigos."},
            ],
            "preguntas": [{"p": "¿Qué hizo el león cuando atrapó al ratón?", "opciones": ["Se lo comió", "Lo soltó", "Lo encerró", "Lo asustó"], "correcta": 1}, {"p": "¿Cómo quedó atrapado el león?", "opciones": ["En una cueva", "En una red de cazadores", "En un pozo", "Entre rocas"], "correcta": 1}, {"p": "¿Cómo ayudó el ratón al león?", "opciones": ["Llamando a otros animales", "Royendo la red", "Trajo un cuchillo", "Empujó la red"], "correcta": 1}],
        },
        "La Cigarra y la Hormiga": {
            "descripcion": "La cigarra canta todo el verano; la hormiga trabaja. Cuando llega el invierno, cada una recoge lo que sembró. Fábula de La Fontaine.",
            "escenas": [
                {"orden": 1, "texto": "Durante el verano la cigarra cantaba todo el día en la rama de un árbol. La hormiga pasaba con granos de trigo y comida, trabajando sin parar para guardar provisiones en su hormiguero."},
                {"orden": 2, "texto": "La cigarra le decía: ¿Por qué trabajas tanto? Ven a cantar conmigo y disfruta del sol. La hormiga respondía: preparo comida para el invierno. Tú deberías hacer lo mismo."},
                {"orden": 3, "texto": "La cigarra se reía y seguía cantando. Llegó el otoño y luego el invierno. Hizo frío y no había nada que comer en el campo."},
                {"orden": 4, "texto": "La cigarra, hambrienta y tiritando, fue a pedirle a la hormiga un poco de comida. Le dijo: te dije que cantaras; ahora baila. Y cerró la puerta."},
                {"orden": 5, "texto": "En versiones más amables, la hormiga comparte un poco y la cigarra aprende a trabajar el próximo verano. La fábula nos enseña que hay que prepararse y esforzarse a su tiempo."},
            ],
            "preguntas": [{"p": "¿Qué hacía la cigarra en verano?", "opciones": ["Trabajaba", "Cantaba", "Dormía", "Guardaba comida"], "correcta": 1}, {"p": "¿Qué hacía la hormiga?", "opciones": ["Cantaba", "Guardaba comida", "Dormía", "Jugaba"], "correcta": 1}, {"p": "¿Qué le pasó a la cigarra en invierno?", "opciones": ["Tenía comida de sobra", "Pasó hambre", "Se fue al sur", "Vivió con la hormiga"], "correcta": 1}],
        },
        "El Zorro y la Cigüeña": {
            "descripcion": "El zorro invita a la cigüeña a comer en un plato llano; ella no puede. La cigüeña le devuelve la invitación en una jarra de cuello largo. Fábula de Esopo.",
            "escenas": [
                {"orden": 1, "texto": "El zorro invitó a la cigüeña a comer. Puso la sopa en un plato muy llano. El zorro lamía contento, pero la cigüeña con su pico largo no podía probar ni una gota. Se fue con hambre y enfadada."},
                {"orden": 2, "texto": "La cigüeña quiso devolver la invitación. Preparó un buen guiso y lo sirvió dentro de una jarra de cuello largo y estrecho. Ella metía el pico y comía perfectamente."},
                {"orden": 3, "texto": "El zorro no podía meter el hocico en la jarra. Solo podía oler el aroma y lamer por fuera. La cigüeña comió tranquila y le dijo: hoy tú te quedas con hambre, como yo ayer."},
                {"orden": 4, "texto": "El zorro se dio cuenta de que había sido egoísta. Tratar mal a los demás hace que nos traten igual. La cigüeña no quiso ser cruel; solo quiso que el zorro entendiera."},
                {"orden": 5, "texto": "Desde entonces el zorro recordó: no hagas a los demás lo que no quieras para ti. Tratar bien a los amigos es la mejor manera de tener buenos amigos."},
            ],
            "preguntas": [{"p": "¿En qué sirvió el zorro la comida a la cigüeña?", "opciones": ["En una jarra", "En un plato llano", "En un cuenco", "En una olla"], "correcta": 1}, {"p": "¿Cómo devolvió la cigüeña la invitación?", "opciones": ["Con un plato llano", "Con una jarra de cuello largo", "Con nada", "Con la misma comida"], "correcta": 1}, {"p": "¿Qué nos enseña esta fábula?", "opciones": ["Que hay que comer mucho", "Trata a los demás como quieres que te traten", "Que el zorro es listo", "Que las cigüeñas son altas"], "correcta": 1}],
        },
        "La Gallina de los Huevos de Oro": {
            "descripcion": "Una gallina pone un huevo de oro cada día. La avaricia hace que sus dueños la pierdan y se queden sin nada. Fábula de Esopo.",
            "escenas": [
                {"orden": 1, "texto": "Un granjero y su mujer tenían una gallina muy especial: cada mañana ponía un huevo de oro. Vendían el huevo y vivían muy bien. Pero empezaron a pensar: si tiene oro dentro, ¿por qué no quedarnos con todo de una vez?"},
                {"orden": 2, "texto": "La mujer insistía: así seremos ricos de una vez. El granjero dudaba pero al final aceptó. Por querer todo el oro de una vez, perdieron a la gallina para siempre."},
                {"orden": 3, "texto": "No había montañas de oro; era una gallina como las demás. Los dos se quedaron mirando, sin creerlo."},
                {"orden": 4, "texto": "Habían perdido a la gallina que cada día les daba un huevo de oro. Ya no tendrían ni un huevo más. Se arrepintieron mucho pero era tarde."},
                {"orden": 5, "texto": "La avaricia rompe el saco. Quien no sabe esperar y quiere todo de golpe puede perder lo que ya tenía. Es mejor valorar lo que tenemos y no arriesgarlo por codicia."},
            ],
            "preguntas": [{"p": "¿Qué ponía la gallina cada día?", "opciones": ["Un huevo normal", "Un huevo de oro", "Dos huevos", "Nada"], "correcta": 1}, {"p": "¿Qué hicieron los dueños?", "opciones": ["La cuidaron más", "La sacrificaron para sacar todo el oro", "La vendieron", "La regalaron"], "correcta": 1}, {"p": "¿Qué pasó entonces?", "opciones": ["Encontraron mucho oro", "Era como cualquier gallina", "Puso más huevos", "Revivió"], "correcta": 1}],
        },
        "El Pastorcito Mentiroso": {
            "descripcion": "Un pastor que gritaba ¡que viene el lobo! por diversión deja de ser creído cuando el lobo llega de verdad. Fábula de Esopo.",
            "escenas": [
                {"orden": 1, "texto": "Un muchacho cuidaba las ovejas en el monte. Se aburría y un día gritó: ¡Que viene el lobo! ¡Que viene el lobo! Los vecinos subieron corriendo con palos y no había ningún lobo. El pastor se rió mucho."},
                {"orden": 2, "texto": "Al cabo de unos días volvió a gritar: ¡Que viene el lobo! De nuevo los aldeanos subieron y de nuevo era mentira. Se enfadaron y le dijeron que no volverían."},
                {"orden": 3, "texto": "Una tarde de verdad apareció un lobo entre las ovejas. El pastorcito gritó con miedo: ¡Que viene el lobo! ¡De verdad! ¡Ayudadme!"},
                {"orden": 4, "texto": "Nadie subió. Pensaron que era otra broma. El lobo atacó al rebaño y el pastor no pudo hacer nada solo. Perdió varias ovejas."},
                {"orden": 5, "texto": "Cuando bajó al pueblo llorando, le dijeron: quien miente una vez, no es creído cuando dice la verdad. El pastorcito aprendió que la mentira tiene consecuencias muy graves."},
            ],
            "preguntas": [{"p": "¿Qué gritaba el pastor para divertirse?", "opciones": ["¡Fuego!", "¡Que viene el lobo!", "¡Ladrón!", "¡Ayuda!"], "correcta": 1}, {"p": "¿Qué pasó cuando vino el lobo de verdad?", "opciones": ["Todos subieron a ayudarle", "Nadie creyó al pastor", "El lobo se fue", "Las ovejas se defendieron"], "correcta": 1}, {"p": "¿Qué nos enseña esta fábula?", "opciones": ["Que los lobos son malos", "Que quien miente no es creído cuando dice la verdad", "Que hay que cuidar las ovejas", "Que los pastores se aburren"], "correcta": 1}],
        },
        "El Zorro y las Uvas": {
            "descripcion": "Un zorro no alcanza unas uvas y dice que estaban verdes. Fábula de Esopo.",
            "escenas": [
                {"orden": 1, "texto": "Un zorro que pasaba mucha hambre vio un racimo de uvas maduras colgado de una parra alta. Las uvas brillaban al sol y el zorro se relamió."},
                {"orden": 2, "texto": "Dio un salto para cogerlas. No llegó. Dio otro salto más alto. Tampoco. Saltó una y otra vez con todas sus fuerzas."},
                {"orden": 3, "texto": "Cansado y sin haber tocado ni una uva, el zorro se alejó. Entonces se dio la vuelta y dijo en voz alta: ¡Bah! Estaban verdes. Ni las quiero."},
                {"orden": 4, "texto": "En realidad las uvas estaban dulces y maduras. El zorro no quería admitir que no había podido alcanzarlas. Prefería fingir que no le importaban."},
                {"orden": 5, "texto": "Así nació el dicho: despreciar las uvas como el zorro. Cuando no conseguimos algo, a veces decimos que no lo queríamos. Es mejor reconocer el esfuerzo y seguir intentando."},
            ],
            "preguntas": [{"p": "¿Qué quería coger el zorro?", "opciones": ["Manzanas", "Uvas", "Peras", "Cerezas"], "correcta": 1}, {"p": "¿Qué dijo el zorro al no alcanzarlas?", "opciones": ["Que estaban verdes", "Que volvería", "Que pediría ayuda", "Nada"], "correcta": 0}, {"p": "¿Por qué dijo eso?", "opciones": ["Porque era verdad", "Para no admitir que no pudo", "Para que otro las cogiera", "Por enfado"], "correcta": 1}],
        },
        "La Lechera": {
            "descripcion": "Una lechera lleva la leche al mercado y sueña con todo lo que comprará; tropieza y lo pierde todo. Cuento popular.",
            "escenas": [
                {"orden": 1, "texto": "Una muchacha llevaba un cántaro de leche en la cabeza para venderlo en el mercado. Por el camino empezó a hacer cuentas: con el dinero de la leche compraré huevos, nacerán pollos y los venderé."},
                {"orden": 2, "texto": "Con lo que gane compraré un vestido nuevo y iré a la fiesta. Todos me mirarán y el hijo del granjero me pedirá que sea su novia. Y siguió soñando sin mirar el camino."},
                {"orden": 3, "texto": "Pensó: le diré que no de entrada, así me buscará más. Y con el gesto de negar movió la cabeza. El cántaro se balanceó y cayó al suelo."},
                {"orden": 4, "texto": "La leche se derramó por el camino. No había leche, ni huevos, ni pollos, ni vestido, ni fiesta. La lechera se sentó y lloró."},
                {"orden": 5, "texto": "No hay que contar los pollos antes de que nazcan. Soñar está bien, pero sin olvidar lo que tenemos entre manos. La realidad es lo que pisamos ahora."},
            ],
            "preguntas": [{"p": "¿Qué llevaba la lechera al mercado?", "opciones": ["Huevos", "Un cántaro de leche", "Pollos", "Un vestido"], "correcta": 1}, {"p": "¿Qué hizo que perdiera la leche?", "opciones": ["Un perro", "Movió la cabeza soñando", "Se la robaron", "El cántaro se rompió solo"], "correcta": 1}, {"p": "¿Qué nos enseña el cuento?", "opciones": ["A vender leche", "No contar con lo que aún no tenemos", "A ir a fiestas", "A llevar bien el cántaro"], "correcta": 1}],
        },
        "El Perro y su Reflejo": {
            "descripcion": "Un perro lleva un hueso y al ver su reflejo en el agua quiere el del otro perro; abre la boca y pierde el suyo. Fábula de Esopo.",
            "escenas": [
                {"orden": 1, "texto": "Un perro encontró un hueso jugoso y lo cogió en la boca para llevarlo a un lugar tranquilo. Cruzaba un puente sobre un río cuando miró hacia abajo."},
                {"orden": 2, "texto": "En el agua vio el reflejo de otro perro con otro hueso en la boca. No entendió que era su propia imagen. Pensó: ese hueso es más grande que el mío."},
                {"orden": 3, "texto": "Quiso gruñir para asustar al otro perro y quedarse con su hueso. Abrió la boca para ladrar. En ese instante su hueso se cayó al río y se lo llevó la corriente."},
                {"orden": 4, "texto": "El reflejo desapareció. El perro se quedó sin hueso y con hambre. Había perdido lo que tenía por querer lo que creía que tenía el otro."},
                {"orden": 5, "texto": "La codicia y la envidia nos hacen perder lo que ya tenemos. Es mejor valorar lo nuestro y no arriesgarlo por lo que vemos en los demás."},
            ],
            "preguntas": [{"p": "¿Qué llevaba el perro en la boca?", "opciones": ["Un pan", "Un hueso", "Un palo", "Nada"], "correcta": 1}, {"p": "¿Qué vio en el agua?", "opciones": ["Un pez", "Su reflejo", "Otro perro de verdad", "Piedras"], "correcta": 1}, {"p": "¿Por qué perdió el hueso?", "opciones": ["Se lo quitaron", "Abrió la boca para ladrar", "Se cayó al tropezar", "Lo tiró"], "correcta": 1}],
        },
        "La Hormiga y la Paloma": {
            "descripcion": "Una hormiga es salvada por una paloma; después la hormiga salva a la paloma. Fábula sobre la gratitud.",
            "escenas": [
                {"orden": 1, "texto": "Una hormiga fue a beber al río y la corriente la arrastró. Iba a ahogarse cuando una paloma que estaba en una rama vio el peligro. Arrancó una hoja y la dejó caer al agua."},
                {"orden": 2, "texto": "La hormiga subió a la hoja y llegó a la orilla. Estaba muy agradecida y le dijo a la paloma: algún día te devolveré el favor. La paloma sonrió y siguió su camino."},
                {"orden": 3, "texto": "Días después un cazador apuntó con su escopeta a la paloma. La hormiga lo vio, subió por la pierna del cazador y le dio un fuerte mordisco."},
                {"orden": 4, "texto": "El cazador gritó y falló el tiro. La paloma escapó volando. La hormiga había cumplido su promesa."},
                {"orden": 5, "texto": "Un favor, por pequeño que sea, puede devolverse de la manera más inesperada. La bondad se multiplica cuando la recordamos y la devolvemos."},
            ],
            "preguntas": [{"p": "¿Quién salvó primero a la hormiga?", "opciones": ["Un pez", "La paloma", "Un niño", "Otra hormiga"], "correcta": 1}, {"p": "¿Cómo ayudó la hormiga a la paloma?", "opciones": ["Llevándole comida", "Mordiendo al cazador", "Avisando con gritos", "Empujando la escopeta"], "correcta": 1}, {"p": "¿Qué nos enseña esta fábula?", "opciones": ["Que las hormigas pican", "Que la gratitud y la ayuda se devuelven", "Que los cazadores son malos", "Que las palomas vuelan"], "correcta": 1}],
        },
        "La Bella y la Bestia": {
            "descripcion": "Un mercader promete a una bestia a su hija; ella se queda en el castillo y el amor rompe el hechizo. Cuento de Jeanne-Marie Leprince de Beaumont.",
            "escenas": [
                {"orden": 1, "texto": "Un mercader rico perdió su fortuna. Una noche se refugió en un castillo encantado y cogió una rosa del jardín para su hija Bella. Apareció la Bestia: un ser terrible que le dijo que debía morir o enviar a una de sus hijas."},
                {"orden": 2, "texto": "Bella fue al castillo para salvar a su padre. La Bestia la trató con amabilidad: le dio habitaciones bonitas y la invitaba a cenar. Bella tenía miedo al principio pero poco a poco lo fue conociendo."},
                {"orden": 3, "texto": "Bella echaba de menos a su padre. La Bestia le dejó ir a verlo con un espejo mágico. Bella se demoró y al mirar el espejo vio que la Bestia estaba muy enferma. Volvió corriendo al castillo."},
                {"orden": 4, "texto": "Encontró a la Bestia débil y triste. Bella le dijo que lo quería y que no quería que muriera. En ese momento brilló una luz y la Bestia se transformó en un príncipe."},
                {"orden": 5, "texto": "Un hada lo había hechizado por ser egoísta. Solo el amor verdadero podía romper el hechizo. Bella había visto la bondad bajo su aspecto de bestia. Se casaron y vivieron felices en el castillo."},
            ],
            "preguntas": [{"p": "¿Qué cogió el padre en el castillo que enfadó a la Bestia?", "opciones": ["Un libro", "Una rosa", "Un anillo", "Comida"], "correcta": 1}, {"p": "¿Qué rompió el hechizo de la Bestia?", "opciones": ["Un beso", "El amor verdadero de Bella", "Un hechizo", "La rosa"], "correcta": 1}, {"p": "¿En qué se transformó la Bestia?", "opciones": ["En un lobo", "En un príncipe", "En un pájaro", "En nada"], "correcta": 1}],
        },
        "Rapunzel": {
            "descripcion": "Una niña con una larga trenza está encerrada en una torre; un príncipe la visita y al final se reúnen. Cuento de los hermanos Grimm.",
            "escenas": [
                {"orden": 1, "texto": "Un hombre y su mujer no tenían hijos. Detrás de su casa había un jardín de una bruja. La mujer deseaba comer los rábanos del jardín. El hombre entró a cogerlos y la bruja lo atrapó. A cambio le pidió el bebé que iban a tener: Rapunzel."},
                {"orden": 2, "texto": "Cuando Rapunzel creció, la bruja la encerró en una torre sin puerta. Para subir, la bruja gritaba: Rapunzel, suelta tu trenza. Rapunzel dejaba caer su larga cabellera y la bruja trepaba."},
                {"orden": 3, "texto": "Un príncipe oyó cantar a Rapunzel y quiso conocerla. Cuando la bruja se fue, gritó lo mismo y Rapunzel lo dejó subir. Se hicieron amigos y se prometieron amor. La bruja descubrió al príncipe y lo expulsó; cortó la trenza a Rapunzel y la envió lejos."},
                {"orden": 4, "texto": "La bruja esperó al príncipe y lo hizo subir; cuando llegó arriba lo dejó caer entre espinas. El príncipe perdió la vista y vagó por el bosque años."},
                {"orden": 5, "texto": "Un día oyó la voz de Rapunzel. Ella lo reconoció y sus lágrimas tocaron sus ojos: el príncipe recuperó la vista. Se casaron y vivieron felices. El amor y la paciencia habían vencido."},
            ],
            "preguntas": [{"p": "¿Dónde estaba encerrada Rapunzel?", "opciones": ["En un castillo", "En una torre", "En una cueva", "En el bosque"], "correcta": 1}, {"p": "¿Cómo subía la bruja a la torre?", "opciones": ["Por una escalera", "Trepando por la trenza de Rapunzel", "Volando", "Por una cuerda"], "correcta": 1}, {"p": "¿Qué le pasó al príncipe cuando la bruja lo descubrió?", "opciones": ["Lo encerró", "Lo dejó caer y perdió la vista", "Lo convirtió en piedra", "Nada"], "correcta": 1}],
        },
        "Los Siete Cabritillos": {
            "descripcion": "La cabra deja a sus siete cabritillos en casa; el lobo los engaña y se los come; la madre los rescata. Cuento de los hermanos Grimm.",
            "escenas": [
                {"orden": 1, "texto": "Una cabra tenía siete cabritillos a los que quería mucho. Antes de ir al bosque a buscar comida les dijo: no abráis a nadie. Si es el lobo, mostrará sus patas negras y su voz ronca. Solo abrid a mi voz suave y mis patas blancas."},
                {"orden": 2, "texto": "El lobo fue a la casita y llamó con voz ronca. Los cabritillos dijeron: tú eres el lobo. El lobo fue a una tienda, se puso harina en la pata y volvió. Engañó a los pequeños y entró."},
                {"orden": 3, "texto": "Los cabritillos corrieron a esconderse. El lobo los encontró uno a uno y se los tragó. Solo el más pequeño se escondió en el reloj de pared y el lobo no lo vio."},
                {"orden": 4, "texto": "La madre volvió y el cabritillo le contó todo. Encontraron al lobo dormido bajo un árbol, con la barriga llena. La cabra abrió la barriga con unas tijeras y sacó a los seis cabritillos vivos."},
                {"orden": 5, "texto": "Llenaron la barriga del lobo de piedras y la cerraron. Cuando el lobo despertó y fue a beber al río, el peso lo hizo caer y se ahogó. Los siete cabritillos y su madre vivieron felices."},
            ],
            "preguntas": [{"p": "¿Cuántos cabritillos eran?", "opciones": ["Cinco", "Seis", "Siete", "Ocho"], "correcta": 2}, {"p": "¿Quién se escondió y no fue comido?", "opciones": ["El mayor", "El más pequeño", "Ninguno", "Todos"], "correcta": 1}, {"p": "¿Qué pusieron en la barriga del lobo?", "opciones": ["Comida", "Piedras", "Agua", "Nada"], "correcta": 1}],
        },
        "El Flautista de Hamelín": {
            "descripcion": "Un pueblo invadido por ratas promete pagar al flautista; no cumplen y él se lleva a los niños. Leyenda alemana.",
            "escenas": [
                {"orden": 1, "texto": "La ciudad de Hamelín estaba llena de ratas. Comían la comida, mordían a la gente y nadie podía con ellas. El alcalde prometió una recompensa a quien las librara. Llegó un hombre con una flauta y dijo: yo las sacaré."},
                {"orden": 2, "texto": "El flautista tocó su flauta y todas las ratas salieron de sus escondites y lo siguieron. Caminó hasta el río y las ratas se lanzaron al agua. Hamelín quedó limpio de ratas."},
                {"orden": 3, "texto": "El flautista volvió a cobrar pero el alcalde y los vecinos no quisieron pagarle. Dijeron que era muy caro. El flautista se enfadó y dijo: me vengaré."},
                {"orden": 4, "texto": "Al día siguiente, cuando los adultos estaban en la iglesia, el flautista tocó de nuevo. Todos los niños del pueblo lo siguieron como habían seguido las ratas. Los llevó fuera del pueblo hacia la montaña."},
                {"orden": 5, "texto": "Una puerta en la montaña se abrió y los niños entraron; luego se cerró. Solo quedó un niño cojo que no pudo llegar. En algunas versiones el pueblo paga al fin y los niños vuelven. La leyenda enseña a cumplir las promesas."},
            ],
            "preguntas": [{"p": "¿Qué invadió Hamelín?", "opciones": ["Lobos", "Ratas", "Moscas", "Pájaros"], "correcta": 1}, {"p": "¿Por qué el flautista se enfadó?", "opciones": ["Porque no le gustaba el pueblo", "Porque no le pagaron", "Porque las ratas volvieron", "Porque se fue la luz"], "correcta": 1}, {"p": "¿A quiénes se llevó después?", "opciones": ["A las ratas otra vez", "A los adultos", "A los niños", "A los animales"], "correcta": 2}],
        },
        "La Zorra y el Cuervo": {
            "descripcion": "Un cuervo tiene un queso; la zorra lo halaga para que cante y lo deje caer. Fábula de Esopo.",
            "escenas": [
                {"orden": 1, "texto": "Un cuervo había encontrado un trozo de queso y se subió a una rama para comérselo tranquilo. Una zorra pasaba por ahí y el olor del queso la atrajo."},
                {"orden": 2, "texto": "La zorra no podía alcanzar al cuervo. Entonces dijo: Qué plumas tan bonitas tienes y qué voz tan clara debes de tener. ¿Cantarías para mí? El cuervo se hinchó de orgullo."},
                {"orden": 3, "texto": "El cuervo quiso demostrar su voz. Abrió el pico para cantar y el queso se cayó al suelo. La zorra lo cogió al vuelo y dijo: Con tu voz no te hace falta el queso. Y se marchó."},
                {"orden": 4, "texto": "El cuervo se quedó sin queso y muy avergonzado. Había creído los halagos y había sido engañado."},
                {"orden": 5, "texto": "No hay que creer todo lo que nos dicen por halagos. A veces nos adulan para sacarnos algo. La prudencia vale más que el orgullo."},
            ],
            "preguntas": [{"p": "¿Qué tenía el cuervo?", "opciones": ["Pan", "Queso", "Fruta", "Nada"], "correcta": 1}, {"p": "¿Qué hizo la zorra para conseguirlo?", "opciones": ["Subió al árbol", "Halagó al cuervo para que cantara", "Le pidió compartir", "Lo asustó"], "correcta": 1}, {"p": "¿Qué nos enseña la fábula?", "opciones": ["Que los cuervos cantan mal", "No creer halagos que nos hacen perder algo", "Que el queso es rico", "Que la zorra es lista"], "correcta": 1}],
        },
        "El Rey Midas": {
            "descripcion": "Un rey pide que todo lo que toque se convierta en oro; al tocar a su hija se arrepiente. Leyenda griega.",
            "escenas": [
                {"orden": 1, "texto": "El rey Midas amaba el oro más que nada. Un día ayudó a un amigo del dios Dioniso y este le concedió un deseo. Midas pidió: que todo lo que toque se convierta en oro."},
                {"orden": 2, "texto": "Al principio Midas estaba feliz. Tocaba una piedra y se volvía oro, una flor y era oro. Pero cuando quiso comer, la comida se convertía en oro y no podía probarla."},
                {"orden": 3, "texto": "Midas tenía hambre y miedo. Entonces su hija corrió a abrazarlo para consolarlo. En el instante en que la tocó, su hija se convirtió en una estatua de oro."},
                {"orden": 4, "texto": "Midas lloró y suplicó a Dioniso que quitara el don. El dios le dijo que se bañara en un río especial. Así lo hizo y perdió el poder."},
                {"orden": 5, "texto": "Al tocar de nuevo a su hija, ella volvió a la vida. Midas aprendió que hay cosas mucho más valiosas que el oro: el amor y la familia."},
            ],
            "preguntas": [{"p": "¿Qué deseo pidió Midas?", "opciones": ["Ser inmortal", "Que todo lo que tocara fuera oro", "Tener un castillo", "Ser el más fuerte"], "correcta": 1}, {"p": "¿Quién se convirtió en oro al abrazarlo?", "opciones": ["La reina", "Su hija", "Un sirviente", "Su perro"], "correcta": 1}, {"p": "¿Cómo perdió el poder?", "opciones": ["Rezando", "Bañándose en un río especial", "Pidiendo perdón", "Durmiendo"], "correcta": 1}],
        },
        "El Sastrecillo Valiente": {
            "descripcion": "Un sastre mata siete moscas de un golpe y se cree héroe; con astucia vence a gigantes y gana la corona. Cuento de los hermanos Grimm.",
            "escenas": [
                {"orden": 1, "texto": "Un sastre mató siete moscas de un golpe y se cosió un cinturón que decía Siete de un golpe. Creyendo que era un gran héroe, salió al mundo. Un gigante lo desafió a aplastar una piedra; el sastre sacó un queso y lo apretó como si fuera piedra. El gigante se asustó."},
                {"orden": 2, "texto": "El gigante lo llevó a su cueva con otros gigantes. Por la noche el sastre se sentó donde no le cayera una roca que los gigantes soltaban. Por la mañana los gigantes lo creyeron invencible."},
                {"orden": 3, "texto": "El rey lo mandó a capturar a dos gigantes que asolaban el reino. El sastre subió a un árbol y les tiró piedras; los gigantes se pelearon entre sí y se mataron."},
                {"orden": 4, "texto": "Luego debía capturar un unicornio. Se escondió detrás de un árbol y cuando el unicornio embistió, lo enganchó en el tronco. El rey le puso una última prueba: cazar un jabalí feroz."},
                {"orden": 5, "texto": "El sastre encerró al jabalí en una capilla y el rey tuvo que darle a su hija y la mitad del reino. La valentía y la astucia pueden más que la fuerza. Y el sastrecillo vivió como rey."},
            ],
            "preguntas": [{"p": "¿Qué había matado el sastre de un golpe?", "opciones": ["Siete gigantes", "Siete moscas", "Siete lobos", "Siete dragones"], "correcta": 1}, {"p": "¿Qué escribió en su cinturón?", "opciones": ["Soy el más fuerte", "Siete de un golpe", "Rey del mundo", "Nada"], "correcta": 1}, {"p": "¿Qué le dio el rey al final?", "opciones": ["Oro", "Su hija y la mitad del reino", "Un castillo", "Un caballo"], "correcta": 1}],
        },
        "Peter Pan": {
            "descripcion": "Un niño que no crece lleva a Wendy y sus hermanos al país de Nunca Jamás. Obra de J.M. Barrie.",
            "escenas": [
                {"orden": 1, "texto": "Peter Pan era un niño que volaba y nunca crecía. Vivía en Nunca Jamás con los niños perdidos. Una noche entró por la ventana de la casa de Wendy Darling y le contó historias de hadas y piratas. Sus hermanos John y Michael despertaron y Peter les enseñó a volar."},
                {"orden": 2, "texto": "Peter los llevó volando hasta Nunca Jamás. Allí conocieron a Campanilla, el hada celosa, y a los niños perdidos. El capitán Garfio y su barco de piratas querían atrapar a Peter."},
                {"orden": 3, "texto": "Wendy cuidaba de los niños como una madre. Peter luchaba contra Garfio y los piratas. Campanilla bebió un veneno que iba para Peter y casi muere; los niños aplaudieron para creer en las hadas y la salvaron."},
                {"orden": 4, "texto": "Garfio capturó a los niños y a Wendy. Peter fue a rescatarlos y luchó con Garfio. El cocodrilo que perseguía al capitán por haberse comido su mano llegó y Garfio cayó al mar."},
                {"orden": 5, "texto": "Wendy y sus hermanos volvieron a casa. Peter se quedó en Nunca Jamás para siempre joven. Prometió volver a buscar a Wendy. Creer en la magia y en no olvidar al niño que llevamos dentro es el mensaje de Peter Pan."},
            ],
            "preguntas": [{"p": "¿Dónde vive Peter Pan?", "opciones": ["En Londres", "En Nunca Jamás", "En el bosque", "En el mar"], "correcta": 1}, {"p": "¿Quién es el enemigo de Peter?", "opciones": ["Un lobo", "El capitán Garfio", "Un dragón", "La bruja"], "correcta": 1}, {"p": "¿Qué hada acompaña a Peter?", "opciones": ["El hada azul", "Campanilla", "Tinker Bell", "Las dos últimas"], "correcta": 3}],
        },
        "El Mago de Oz": {
            "descripcion": "Dorothy y su perro son llevados por un tornado a Oz; busca al Mago para volver a casa. Novela de L. Frank Baum.",
            "escenas": [
                {"orden": 1, "texto": "Dorothy vivía en Kansas con sus tíos y su perro Toto. Un tornado levantó la casa y la llevó hasta el país de Oz. La casa cayó sobre la malvada bruja del Este. Los munchkins le dieron las zapatillas de plata y le dijeron que fuera a la Ciudad Esmeralda a ver al Mago."},
                {"orden": 2, "texto": "Por el camino conoció al Espantapájaros, que quería un cerebro; al Hombre de Hojalata, que quería un corazón; y al León Cobarde, que quería valor. Los cuatro fueron juntos a ver al Mago."},
                {"orden": 3, "texto": "En la Ciudad Esmeralda el Mago les dijo que debían derrotar a la Bruja del Oeste. La bruja envió monos y soldados. Dorothy tiró agua sobre la bruja y esta se derritió."},
                {"orden": 4, "texto": "Volvieron al Mago. Resultó ser un hombre normal que había llegado en globo. No tenía magia real pero les dio a cada uno lo que creían necesitar: ya lo tenían dentro. A Dorothy le dijo que las zapatillas podían llevarla a casa."},
                {"orden": 5, "texto": "Dorothy dio tres golpes con los talones y dijo: No hay lugar como mi casa. Despertó en Kansas con su familia. A veces lo que buscamos está en nosotros o en el camino de vuelta a casa."},
            ],
            "preguntas": [{"p": "¿Cómo llegó Dorothy a Oz?", "opciones": ["En globo", "En un tornado", "Andando", "En barco"], "correcta": 1}, {"p": "¿Qué personaje quería un cerebro?", "opciones": ["El León", "El Espantapájaros", "El Hombre de Hojalata", "Toto"], "correcta": 1}, {"p": "¿Cómo venció Dorothy a la Bruja del Oeste?", "opciones": ["Con fuego", "Tirándole agua", "Con un hechizo", "Con la ayuda del Mago"], "correcta": 1}],
        },
        "Alicia en el País de las Maravillas": {
            "descripcion": "Alicia sigue a un conejo blanco y cae por una madriguera a un mundo de fantasía. Obra de Lewis Carroll.",
            "escenas": [
                {"orden": 1, "texto": "Alicia estaba aburrida junto al río cuando vio un conejo blanco con reloj que decía: ¡Llego tarde! Lo siguió y cayó por una madriguera muy profunda. Llegó a una sala con muchas puertas y una botella que decía Bébeme; se encogió."},
                {"orden": 2, "texto": "Comió un pastel que decía Cómeme y creció tanto que no cabía. Lloró y formó un charco de lágrimas. Después se hizo pequeña otra vez y nadó hasta la orilla donde había animales extraños."},
                {"orden": 3, "texto": "Conoció al Gato de Cheshire que desaparece y deja solo la sonrisa; a la Liebre de Marzo y al Sombrerero en un té sin fin; y a la Reina de Corazones que quería cortar cabezas por nada."},
                {"orden": 4, "texto": "Jugó al croquet con flamencos y erizos. La Reina la acusó y todo acabó en un juicio absurdo. Alicia dijo: ¡Sois solo un montón de naipes! Y empezó a despertar."},
                {"orden": 5, "texto": "Alicia despertó con la cabeza en el regazo de su hermana. Le contó el sueño. Los sueños pueden ser tan locos y tan vivos que a veces no sabemos si hemos estado en otro mundo."},
            ],
            "preguntas": [{"p": "¿Quién llevó a Alicia a la madriguera?", "opciones": ["Un gato", "Un conejo blanco", "Un pájaro", "Su hermana"], "correcta": 1}, {"p": "¿Qué personaje deja solo la sonrisa?", "opciones": ["La Reina", "El Gato de Cheshire", "El Sombrerero", "La Liebre"], "correcta": 1}, {"p": "¿Cómo termina la historia?", "opciones": ["Alicia se queda en Oz", "Alicia despierta y era un sueño", "Alicia se hace reina", "El conejo la lleva a casa"], "correcta": 1}],
        },
        "El Principito": {
            "descripcion": "Un piloto conoce en el desierto a un niño de otro planeta. Novela de Antoine de Saint-Exupéry.",
            "escenas": [
                {"orden": 1, "texto": "Un piloto tuvo una avería en el desierto del Sáhara. Al despertar vio a un niño pequeño que le pidió: dibújame un cordero. Era el Principito, que venía de un asteroide muy pequeño donde tenía una rosa y tres volcanes."},
                {"orden": 2, "texto": "El Principito contó que había visitado otros asteroides: un rey sin súbditos, un vanidoso, un borracho, un hombre de negocios que contaba estrellas, un farolero y un geógrafo. Ninguno le había gustado tanto como su rosa."},
                {"orden": 3, "texto": "En la Tierra conoció a una serpiente, a una flor y a un zorro. El zorro le dijo: solo se ve bien con el corazón. Lo esencial es invisible a los ojos. Si me domesticas, seré único para ti."},
                {"orden": 4, "texto": "El Principito entendió que su rosa era única porque era él quien la había cuidado. El piloto y él buscaron un pozo en el desierto y encontraron uno. El agua era como un regalo."},
                {"orden": 5, "texto": "La serpiente ayudó al Principito a volver a su planeta. El piloto miró las estrellas y supo que en una de ellas estaba el Principito riendo. Cuando mires el cielo, recuerda: lo esencial es invisible a los ojos."},
            ],
            "preguntas": [{"p": "¿Dónde conoce el piloto al Principito?", "opciones": ["En un bosque", "En el desierto del Sáhara", "En la luna", "En un avión"], "correcta": 1}, {"p": "¿Qué le dice el zorro que es invisible?", "opciones": ["El viento", "Lo esencial", "Las estrellas", "El agua"], "correcta": 1}, {"p": "¿De dónde venía el Principito?", "opciones": ["De la Tierra", "De un asteroide pequeño", "De Marte", "De un sueño"], "correcta": 1}],
        },
        "El Libro de la Selva": {
            "descripcion": "Mowgli, un niño criado por lobos, vive aventuras en la selva con Baloo y Bagheera. Relatos de Rudyard Kipling.",
            "escenas": [
                {"orden": 1, "texto": "Un niño pequeño apareció en la cueva de unos lobos. La pantera Bagheera lo encontró y los lobos lo acogieron. Lo llamaron Mowgli. Shere Khan, el tigre, quería cazarlo pero la manada no se lo permitió."},
                {"orden": 2, "texto": "Mowgli creció aprendiendo la ley de la selva. El oso Baloo le enseñó a hablar con los animales y a sobrevivir. Bagheera lo cuidaba y lo advertía del peligro de Shere Khan."},
                {"orden": 3, "texto": "Los monos se llevaron a Mowgli a las ruinas. Baloo y Bagheera lo rescataron con ayuda de la serpiente Kaa. Mowgli fue a la aldea de los hombres y vivió un tiempo con ellos."},
                {"orden": 4, "texto": "Shere Khan quiso atacar a Mowgli. Mowgli reunió a los búfalos y lo llevó hacia una trampa; el tigre murió. Los hombres de la aldea no lo aceptaron y Mowgli volvió a la selva."},
                {"orden": 5, "texto": "Mowgli entendió que era de la selva pero también de los hombres. Con sus amigos Baloo y Bagheera, siguió viviendo entre dos mundos. La naturaleza y el respeto son la verdadera ley."},
            ],
            "preguntas": [{"p": "¿Quién crió a Mowgli?", "opciones": ["Los monos", "Los lobos", "Los osos", "La pantera"], "correcta": 1}, {"p": "¿Qué oso le enseña la ley de la selva?", "opciones": ["Shere Khan", "Baloo", "Kaa", "Bagheera"], "correcta": 1}, {"p": "¿Quién es el enemigo tigre?", "opciones": ["Baloo", "Bagheera", "Shere Khan", "Kaa"], "correcta": 2}],
        },
        "Aladino": {
            "descripcion": "Un joven encuentra una lámpara mágica con un genio que cumple deseos. Cuento de Las mil y una noches.",
            "escenas": [
                {"orden": 1, "texto": "Aladino era un joven pobre. Un mago lo engañó para que entrara en una cueva y buscara una lámpara. Dentro había tesoros. El mago quiso encerrarlo pero Aladino se quedó con la lámpara y un anillo mágico."},
                {"orden": 2, "texto": "Al frotar la lámpara apareció un genio que cumplía deseos. Aladino pidió salir de la cueva y después riquezas para él y su madre. Se enamoró de la princesa y el genio lo ayudó a casarse con ella."},
                {"orden": 3, "texto": "El mago volvió y engañó a la esposa de Aladino cambiando una lámpara vieja por la mágica. El genio y el palacio se fueron al país del mago. Aladino usó el anillo y un genio menor lo llevó hasta allí."},
                {"orden": 4, "texto": "Aladino recuperó la lámpara con la ayuda de su esposa. El genio volvió a obedecerle y trajo el palacio de vuelta. El mago fue vencido."},
                {"orden": 5, "texto": "Aladino y la princesa vivieron felices. La verdadera riqueza no está en los deseos mágicos sino en ser bueno y valiente. Y la lámpara quedó guardada para usarla con sabiduría."},
            ],
            "preguntas": [{"p": "¿Qué salía de la lámpara?", "opciones": ["Humo", "Un genio", "Luz", "Un pájaro"], "correcta": 1}, {"p": "¿Quién robó la lámpara?", "opciones": ["El rey", "El mago", "La princesa", "Nadie"], "correcta": 1}, {"p": "¿Con qué otro objeto mágico contaba Aladino?", "opciones": ["Una alfombra", "Un anillo", "Una espada", "Un espejo"], "correcta": 1}],
        },
    }


def get_imagen_por_defecto(titulo):
    """Devuelve la misma URL de portada para usar en escenas si no se especifica."""
    return ""  # El script de mejora conservará la imagen original del cuento.

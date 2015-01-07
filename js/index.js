/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* Abro la base de datos */
var dir_datos = 'http://ohio.inglobe.com.ar/backend/';
var db = false;
var db = openDatabase('uni_ohio','1','', 3*1024*1024);

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        //var = openDatabase('uni_ohio','1','', 3*1024*1024);
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

/* Verificar si existe base de datos */
function verificar_base(){
  $('#cargando').show();
  if(!db){
    descargar_base_init();    
  }
  else{
    db.transaction(function(tx){tx.executeSql('select * from usuarios', [], function(tx, rs) {
      if(!rs.rows.length){
        descargar_base_init();        
      } 
      else{
        pantalla_login();
      }
    },  
    function(tx,error){ 
        descargar_base_init();
    }
    )});
  }
}

/* Descargo estructura de base de datos y usuarios */
function descargar_base_init(){
    var tablas=Array(
        "configuracion",
        "usuarios",
        "vacas",
        "partos",
        "becerros",
        "calostro",
        "movimientos"
    );
    descargar_tablas_init(db,tablas,0);
}

/* Descargo tablas */
function descargar_tablas_init(db,tablas,index){
    var total=tablas.length;
    var indice=index;
    var error = 0;
    $.ajax({
        type: "post",
        url: dir_datos+"datos.php",
        dataType: "text",
        data: { accion: "descargar_datos", tabla: tablas[indice], init:'si' },
        cache: false,
        success: function( data ){
            if(data){
                var tmp_datos = data.split('###');
                db.transaction(function(tx) {
                    for(i=0;i<tmp_datos.length;i++){
                        if(tmp_datos[i]!=''){ tx.executeSql(tmp_datos[i]); }
                    }                               
                }, function(){ error=1; }, function(){ error=0; } );
            }
            else{
                error = 1;
            }
        },
        complete: function(){ 
            if(error==1){
                alert("error");
            }
            else{
                if(indice==(total-1)){
                     pantalla_login();
                }
                else{
                    descargar_tablas_init(db,tablas,(indice+1));
                }
            }           
        },
        error: function(){
            alert("error");
        }
    });    
}

/* Pantalla Login (HTML) */
function pantalla_login(){
    if(!localStorage.usu_codigo){
        html='<div class="container">'+
                '<div id="lang" style="margin-top:2%;">'+
                    '<h4><a><img onclick="cambiar_idioma(\'en\')" class="english" src="img/fondo.png" /></a></h4>'+
                    '<h4><a><img onclick="cambiar_idioma(\'es\')" class="espanol" src="img/fondo.png" /></a></h4>'+
                '</div>'+
                '<div id="logo"><img src="img/logo.png"/></div>'+
                '<div class="input-group input-group-lg loginscreen" >'+
                  '<span class="input-group-addon" id="home-ico"><span class="glyphicon glyphicon-user"></span></span>'+
                  '<input id="usu_codigo" type="text" class="form-control" placeholder="'+lang.usuario+'">'+
                '</div>'+
                '<div class="input-group input-group-lg">'+
                  '<span class="input-group-addon" id="lock-ico"><span class="glyphicon glyphicon-lock"></span></span>'+
                  '<input id="usu_password" type="password" class="form-control" placeholder="'+lang.password+'">'+
                '</div>'+
                '<button id="ingresar" style="display:block;width:100%;margin-bottom:10px" type="button" onclick="login()" class="btn btn-inverse btn-lg">'+lang.ingresar+'</button>'+
                '<button id="registrar" style="display:block;width:100%" type="button" onclick="window.open(\'http://www.ecalvin.com\',\'_blank\')" class="btn btn-success btn-lg">'+lang.registrar+'</button>'+
            '</div>';
        $('#app').html(html);
        $('#cargando').hide();
    }
    else{
        $('#cargando').hide();
        pantalla_2();                    
    }
}

/* Acceso de usuarios */
function login(){
    var usu=$('#usu_codigo').val();
    var pass=$('#usu_password').val();
    if(usu!=""&&pass!=""){
        $('#cargando_app').show();
        db.transaction(function(tx){tx.executeSql('select * from usuarios WHERE usu_codigo=? AND usu_password=?', [usu,pass], function(tx, rs) {
          if(rs.rows.length) {
            localStorage.usu_codigo=rs.rows.item(0).usu_codigo;
            localStorage.usu_nombre=rs.rows.item(0).usu_nombre;
            localStorage.usu_rodeo=rs.rows.item(0).usu_rodeo;
            localStorage.usu_rodeo_desc=rs.rows.item(0).usu_rodeo_desc;            
            pantalla_2();            
          }else{
            notificacion("Datos iconrrectos, intente nuevamente.","error");            
          }
        })});        
    }
}

/* Logout */
function logout(){
    localStorage.removeItem("usu_codigo");
    localStorage.removeItem("usu_nombre");
    localStorage.removeItem("usu_rodeo");
    localStorage.removeItem("usu_rodeo_desc");            
    pantalla_login();
}

/* Mostrar notificaciones de sistema */
function notificacion(texto,clase){
    $('#cargando_app').hide();
    $('#notificacion').removeClass();
    $('#notificacion').addClass(clase);
    $('#notificacion').html(texto);
    $('#notificacion').css('bottom','-70px');
    $('#notificacion').show();
    $('#notificacion').animate({ bottom: '0' }, 300);
    setTimeout(function(){
      $('#notificacion').animate({ bottom: '-70px' }, 300);
    },3000)
}

/* Pantalla 2 */
function pantalla_2(){
    $('#cargando_app').show();
    var partos='';
    db.transaction(function(tx){tx.executeSql('select a.par_fecha, a.par_id, a.par_vaca, par_fecha_fin, count(bec_id) as cantbec from partos a left join becerros b ON (a.par_id=b.bec_parto) WHERE a.par_rodeo="'+localStorage.usu_rodeo+'" group by a.par_fecha, a.par_id, a.par_vaca, par_fecha_fin having count(bec_id)<ifnull((case a.par_becerros when 0 then null else a.par_becerros end),"-1") ORDER BY Datetime(substr(par_fecha,7,4)||"-"||substr(par_fecha,4,2)||"-"||substr(par_fecha,1,2)||" "||substr(par_fecha,12,8))',[], function(tx, rs) {
        if(rs.rows.length) {
            for(i=0;i<rs.rows.length;i++){
                diff=datediff(rs.rows.item(i).par_fecha,current_date(),'minutes');
                if(diff > 90){
                    css_back='red';
                }else if(diff > 30){
                    css_back='orange';
                }else{
                    css_back='green';
                }
                partos=partos+''+
                    '<tr>'+
                        '<td onclick="obtener_parto('+rs.rows.item(i).par_id+')"  width="50" height="35" style="background-color:'+css_back+';"><span class="glyphicon glyphicon-pencil" style="border-bottom: black thin solid;"></span></td>'+
                        '<td onclick="'+(!rs.rows.item(i).par_fecha_fin?'pantalla_4('+rs.rows.item(i).par_id+',\''+rs.rows.item(i).par_vaca+'\')':'pantalla_5('+rs.rows.item(i).par_id+')')+'" valign="middle">'+rs.rows.item(i).par_vaca+'</td>'+
                        '<td onclick="'+(!rs.rows.item(i).par_fecha_fin?'pantalla_4('+rs.rows.item(i).par_id+',\''+rs.rows.item(i).par_vaca+'\')':'pantalla_5('+rs.rows.item(i).par_id+')')+'">'+rs.rows.item(i).par_fecha.substring(11,16)+'</td>'+
                        '<td onclick="'+(!rs.rows.item(i).par_fecha_fin?'pantalla_4('+rs.rows.item(i).par_id+',\''+rs.rows.item(i).par_vaca+'\')':'pantalla_5('+rs.rows.item(i).par_id+')')+'">'+rs.rows.item(i).par_fecha.substring(3,5)+'/'+rs.rows.item(i).par_fecha.substring(0,2)+'</td>'+
                    '</tr>';
            }
        }
        var html=''+
        '<div class="header row">'+
            '<div class="col-md-6">'+
            '<h4><strong>Calving App</strong></h4>'+
            '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;z-index:10">'+lang.sincronizar+'</button>'+
            '</div>'+
            '<div class="col-md-6" style="text-align: right;"><h4>'+localStorage.usu_nombre+' ('+localStorage.usu_rodeo_desc+')</h4><a style="color:red;" href="javascript:logout()"><span class="glyphicon glyphicon-remove-circle"></span><strong> '+lang.salir+'</strong></a></div>'+
        '</div>'+
        '<div class="container">'+
        '<div class="margins_small">'+
        '<div class="panel panel-default">'+
          '<div class="panel-heading">'+lang.vacas_activas+': '+rs.rows.length+'</div>'+
          '<div id="tableContainer" class="tableContainer">'+
          '<table id="tabla_fix" class="table table-condensed" >'+
            '<thead>'+
              '<tr>'+
                '<th width="50"></th>'+
                '<th>'+lang.id_vaca+'</th>'+
                '<th>'+lang.hora+'</th>'+
                '<th>'+lang.fecha+'</th>'+
              '</tr>'+
            '</thead>'+
            '<tbody>'+
                partos+          
            '</tbody>'+
           '</table>'+       
           '</div>'+
        '</div>'+
        '<div class="functions">'+
            '<button type="button" onclick="pantalla_3()" class="addcow btn btn-primary btn-lg"><span class="glyphicon glyphicon-plus-sign" style="top:9px"></span>'+lang.nuevo_parto+'</button>'+
            '<button id="becerro" onclick="pantalla_7()" type="submit" class="btn btn-primary btn-lg"><img style="margin-top:-5px" src="img/becerro.png">'+lang.becerros+'</button>'+
            '<button style="width:100%;text-align:left" onclick="pantalla_8()" type="submit" class="btn btn-success btn-lg"><span class="glyphicon glyphicon-time" style="top:9px"></span>'+lang.vacas_frescas+'</button>'+
        '</div>'+
        '</div>'+
        '</div>';
    $('#app').html(html);
    $('#tabla_fix').fixheadertable({ 
        height : 400
    });
    $('#cargando_app').hide();
    })});
}

/* Pantalla 3 */
function pantalla_3(parto){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
            '<div class="col-md-6">'+
            '<h4><img src="img/vaca.png"/> | <strong>'+lang.info_vaca+'</strong></h4>'+
            '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;z-index:10">'+lang.sincronizar+'</button>'+
            '</div>'+
            '<div class="col-md-6" style="text-align: right;"><h4>'+localStorage.usu_nombre+' ('+localStorage.usu_rodeo_desc+')</h4><a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span><strong> '+lang.volver+'</strong></a></div>'+
        '</div>'+
        '<div class="container">'+
            '<form id="frm_comienzo_parto" action="">'+ 
                '<div class="margins_small">'+
                    '<div class="row">'+
                        '<div class="col-md-6">'+
                          '<div class="input-group input-group-sm" >'+
                            '<span class="input-group-addon">'+lang.id_vaca+'</span>'+
                            '<input type="number" onblur="buscar_vaca(this.value)" name="par_vaca" id="par_vaca" class="form-control" placeholder="" value="'+($.isArray(parto)?parto[0]:'')+'">'+
                          '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.corral+'</span>'+
                                '<input type="text" name="par_corral" id="par_corral" class="form-control" placeholder="" value="'+($.isArray(parto)?parto[7]:'')+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                    '<div class="col-md-6">'+
                      '<div class="input-group input-group-sm" >'+
                        '<span class="input-group-addon">'+lang.lactancia+'</span>'+
                        '<input type="number" class="form-control" placeholder="" maxlength="2" name="par_lactancia" id="par_lactancia" value="'+($.isArray(parto)?parto[1]:'')+'">'+
                      '</div>'+
                    '</div>'+
                    '<div class="col-md-6">'+
                      '<div class="input-group input-group-sm" >'+
                        '<span class="input-group-addon">'+lang.cc+'</span>'+
                        '<input type="number" class="form-control" placeholder="" name="par_cc" id="par_cc" value="'+($.isArray(parto)?parto[2]:'')+'">'+
                      '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="row">'+
                    '<div class="raza col-md-12" style="margin-bottom:10px">'+
                        '<h4>'+lang.raza+'</h4>'+
                    '</div>'+
                    '<div id="raza_option"class="input-group input-group-sm col-md-12" style="width: 100%;">'+
                        '<div class="btn-toolbar" role="toolbar">'+
                            '<div class="btn-group-justified" data-toggle="buttons">'+
                                '<label  class="btn btn-default '+($.isArray(parto)&&parto[3]=='h'?'active':'')+'" style="width: 14%;">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="h" '+($.isArray(parto)&&parto[3]=='h'?'checked':'')+'>H'+
                                '</label>'+
                                '<label class="btn btn-default '+($.isArray(parto)&&parto[3]=='j'?'active':'')+'" style="width: 14%;">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="j" '+($.isArray(parto)&&parto[3]=='j'?'checked':'')+'>J'+
                                '</label>'+
                                '<label class="btn btn-default '+($.isArray(parto)&&parto[3]=='x'?'active':'')+'" style="width: 14%;">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="x" '+($.isArray(parto)&&parto[3]=='x'?'checked':'')+'>X'+
                                '</label>'+
                                '<label class="btn btn-default '+($.isArray(parto)&&parto[3]=='b'?'active':'')+'" style="width: 14%;">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="b" '+($.isArray(parto)&&parto[3]=='b'?'checked':'')+'>B'+
                                '</label>'+
                                '<label class="btn btn-default '+($.isArray(parto)&&parto[3]=='r'?'active':'')+'" style="width: 14%;">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="r" '+($.isArray(parto)&&parto[3]=='r'?'checked':'')+'>R'+
                                '</label>'+
                                '<label class="btn btn-default '+($.isArray(parto)&&parto[3]=='g'?'active':'')+'" style="width: 14%;">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="g" '+($.isArray(parto)&&parto[3]=='g'?'checked':'')+'>G'+
                                '</label>'+
                                '<label class="btn btn-default '+($.isArray(parto)&&parto[3]=='.'?'active':'')+'" style="width: 14%;">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="." '+($.isArray(parto)&&parto[3]=='.'?'checked':'')+'>.'+
                                '</label>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="row">'+
                    '<div class="col-md-12">'+
                        '<div class="input-group input-group-sm" >'+
                            '<span class="input-group-addon">'+lang.higiene+'</span>'+
                            '<div id="perineo" class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label class="btn btn-default '+($.isArray(parto)&&parto[4]=='1'?'active':'')+'">'+
                                        '<input name="par_higiene" id="par_higiene" type="radio" value="1" '+($.isArray(parto)&&parto[4]=='1'?'checked':'')+'>1</button>'+
                                        '</label>'+
                                        '<label class="btn btn-default '+($.isArray(parto)&&parto[4]=='2'?'active':'')+'">'+
                                        '<input name="par_higiene" id="par_higiene" type="radio" value="2" '+($.isArray(parto)&&parto[4]=='2'?'checked':'')+'>2</button>'+
                                        '</label>'+
                                        '<label class="btn btn-default '+($.isArray(parto)&&parto[4]=='3'?'active':'')+'">'+
                                        '<input name="par_higiene" id="par_higiene" type="radio" value="3" '+($.isArray(parto)&&parto[4]=='3'?'checked':'')+'>3</button>'+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="row">'+
                    '<div class="col-md-12">'+
                        '<div class="input-group input-group-sm" >'+
                            '<span class="input-group-addon">'+lang.notas+'</span>'+
                            '<textarea class="form-control" placeholder="" name="par_observaciones" id="par_observaciones" rows="4" style="height:auto">'+($.isArray(parto)?parto[8]:'')+'</textarea>'+
                        '</div>'+
                    '</div>'+                    
                '</div>'+
                '<div class="row">'+
                    '<div class="col-md-12">'+
                        '<div class="input-group input-group-sm" >'+
                            '<span class="input-group-addon">'+lang.tecnico+'</span>'+
                            '<input type="text" class="form-control" placeholder="" name="par_tecnico" id="par_tecnico" value="'+($.isArray(parto)?parto[5]:localStorage.usu_nombre)+'">'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                    '<div class="col-md-12">'+
                        '<button type="button" onclick="comienza_parto('+($.isArray(parto)?parto[6]:0)+')" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-time"></span><strong> '+($.isArray(parto)?lang.actualizar:lang.comienza_parto)+'</strong></button>'+
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 4 */
function pantalla_4(par_id,vac_id){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
            '<div class="col-md-6">'+
            '<h4><span class="glyphicon glyphicon-time"></span> | '+lang.parto+'</h4>'+
            '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;z-index:10">'+lang.sincronizar+'</button>'+                
            '</div>'+
            '<div class="col-md-6" style="text-align: right;"><h4>'+localStorage.usu_nombre+' ('+localStorage.usu_rodeo_desc+')</h4><a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span> '+lang.volver+'</a></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins_small">'+
                '<form id="frm_fin_parto" action="">'+
                    '<div class="row">'+
                        '<div class="col-md-8">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.id_vaca+'</span>'+
                                '<input readonly type="text" value="'+vac_id+'" class="form-control" placeholder="" >'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.cantidad_becerros+'</span>'+
                                '<div class="col-md-6">'+
                                    '<div id="perineo" class="btn-toolbar" role="toolbar">'+
                                        '<div class="btn-group-justified" data-toggle="buttons">'+
                                            '<label class="btn btn-default">'+
                                            '<input name="par_becerros" id="par_becerros" type="radio" value="1">1</button>'+
                                            '</label>'+
                                            '<label class="btn btn-default">'+
                                            '<input name="par_becerros" id="par_becerros" type="radio" value="2">2</button>'+
                                            '</label>'+
                                            '<label class="btn btn-default">'+
                                            '<input name="par_becerros" id="par_becerros" type="radio" value="3">3</button>'+
                                            '</label>'+
                                        '</div>'+
                                    '</div>'+
                                '</div>'+                  
                            '</div>'+                  
                        '</div>'+                  
                    '</div>'+
                    '<div class="row">'+
                        '<div class="raza col-md-12" style="margin-bottom:10px">'+
                            '<h4>'+lang.dificultad+'</h4>'+
                        '</div>'+
                        '<div id="raza_option"class="input-group input-group-sm col-md-12" style="width: 100%;">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label class="btn btn-default" style="width: 20%;">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="1">1'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 20%;">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="2">2'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 20%;">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="3">3'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 20%;">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="4">4'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 20%;">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="5">5'+
                                    '</label>'+                                    
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="raza col-md-12" style="margin-bottom:10px">'+
                            '<h4>'+lang.raza+'</h4>'+
                        '</div>'+
                        '<div id="raza_option"class="input-group input-group-sm col-md-12" style="width: 100%;">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label class="btn btn-default" style="width: 14%;">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="h">H'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 14%;">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="j">J'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 14%;">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="x">X'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 14%;">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="b">B'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 14%;">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="r">R'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 14%;">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="g">G'+
                                    '</label>'+
                                    '<label class="btn btn-default" style="width: 14%;">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value=".">.'+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.tecnico+'</span>'+
                                '<input type="text" name="par_tecnico_becerros" id="par_tecnico_becerros" class="form-control" placeholder="" value="'+localStorage.usu_nombre+'">'+
                            '</div>'+
                            '<button type="button" onclick="fin_parto('+par_id+')" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-ok"></span> '+lang.listo+'!</button>'+
                        '</div>'+
                    '</div>'+
                '</form>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 5 */
function pantalla_5(par_id,becerro){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
           '<div class="col-md-6">'+
            '<h4><img src="img/becerro4.png"/> | '+lang.becerro+'</h4>'+
            '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;z-index:10">'+lang.sincronizar+'</button>'+        
            '</div>'+        
           '<div class="col-md-6" style="text-align: right;"><h4>'+localStorage.usu_nombre+' ('+localStorage.usu_rodeo_desc+')</h4><a href="javascript:pantalla_7()"><span class="glyphicon glyphicon-arrow-left"></span> '+lang.volver+'</a></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins_small">'+
                '<form id="frm_cargar_becerro" action="">'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div id="gender" class="btn-group-justified" data-toggle="buttons">'+
                                    '<label name="lbl_bec_sexo" class="btn btn-default '+($.isArray(becerro)&&becerro[1]=='M'?'active':'')+'">'+
                                        '<input name="bec_sexo" id="bec_sexo" type="radio" value="M" '+($.isArray(becerro)&&becerro[1]=='M'?'checked':'')+'>'+lang.macho+''+
                                    '</label>'+ 
                                    '<label name="lbl_bec_sexo" class="btn btn-default '+($.isArray(becerro)&&becerro[1]=='H'?'active':'')+'">'+
                                        '<input name="bec_sexo" id="bec_sexo" type="radio" value="H" '+($.isArray(becerro)&&becerro[1]=='H'?'checked':'')+'>'+lang.hembra+''+
                                    '</label>'+
                                '</div>'+ 
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div id="status_b" class="btn-group-justified" data-toggle="buttons">'+
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='v'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="v" '+($.isArray(becerro)&&becerro[2]=='v'?'checked':'')+'>'+lang.bec_cond_V+''+
                                    '</label>'+
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='m'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="m" '+($.isArray(becerro)&&becerro[2]=='m'?'checked':'')+'>'+lang.bec_cond_M+''+
                                    '</label>'+
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='a'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="a" '+($.isArray(becerro)&&becerro[2]=='a'?'checked':'')+'>'+lang.bec_cond_A+''+
                                    '</label>'+
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='p'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="p" '+($.isArray(becerro)&&becerro[2]=='p'?'checked':'')+'>'+lang.bec_cond_P+''+
                                    '</label>'+                                    
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='mf'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="mf" '+($.isArray(becerro)&&becerro[2]=='mf'?'checked':'')+'>'+lang.bec_cond_MF+''+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.presentacion+'</span>'+
                                '<div id="perineo" class="btn-toolbar" role="toolbar">'+
                                    '<div class="btn-group-justified" data-toggle="buttons">'+
                                        '<label id="lbl_bec_presentacion" class="btn btn-default '+($.isArray(becerro)&&becerro[3]=='1'?'active':'')+'">'+
                                        '<input name="bec_presentacion" id="bec_presentacion" type="radio" value="1" '+($.isArray(becerro)&&becerro[3]=='1'?'checked':'')+'>1</button>'+
                                        '</label>'+
                                        '<label id="lbl_bec_presentacion" class="btn btn-default '+($.isArray(becerro)&&becerro[3]=='2'?'active':'')+'">'+
                                        '<input name="bec_presentacion" id="bec_presentacion" type="radio" value="2" '+($.isArray(becerro)&&becerro[3]=='2'?'checked':'')+'>2</button>'+
                                        '</label>'+
                                        '<label id="lbl_bec_presentacion" class="btn btn-default '+($.isArray(becerro)&&becerro[3]=='3'?'active':'')+'">'+
                                        '<input name="bec_presentacion" id="bec_presentacion" type="radio" value="3" '+($.isArray(becerro)&&becerro[3]=='3'?'checked':'')+'>3</button>'+
                                        '</label>'+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.caravana+'</span>'+
                                '<input type="number" name="bec_caravana" id="bec_caravana" class="form-control" placeholder="" value="'+($.isArray(becerro)?becerro[4]:'')+'" ">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.tecnico+'</span>'+
                                '<input type="text" name="bec_tecnico" id="bec_tecnico" class="form-control" placeholder="" value="'+($.isArray(becerro)?becerro[5]:localStorage.usu_nombre)+'">'+
                            '</div>'+
                            '<button id="btn_agregar_becerro" onclick="cargar_becerro('+par_id+','+($.isArray(becerro)?becerro[6]:0)+')" type="button" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-plus-sign"></span> '+($.isArray(becerro)?lang.actualizar:lang.agregar)+'</button>'+
                        '</div>'+
                    '</div>'+
                '</form>'+
                '<div id="tabla_becerros" style="margin-top:20px" class="row">'+                
                '</div>'+
            '</div>'+
        '</div>';
    mostrar_becerros(par_id,($.isArray(becerro)?becerro[6]:0));
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 6 */
function pantalla_6(bec_id,bec_caravana,calostro){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
           '<div class="col-md-6">'+
            '<h4><img src="img/becerro4.png"/> | '+lang.calostro+'</h4>'+
            '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;z-index:10">'+lang.sincronizar+'</button>'+                
            '</div>'+
           '<div class="col-md-6" style="text-align: right;"><h4>'+localStorage.usu_nombre+' ('+localStorage.usu_rodeo_desc+')</h4><a href="javascript:pantalla_7()"><span class="glyphicon glyphicon-arrow-left"></span> '+lang.volver+'</a></div>'+
        '</div>'+
        '<div class="container">'+
            '<ul class="nav nav-tabs nav-justified">'+
                '<li id="lc_1" role="presentation" class="active"><a href="javascript:;" onclick="mostrar_tab_calostro(1)" style="font-size: 25px;padding: 10px;color:#555">'+lang.calostro+' 1</a></li>'+
                '<li id="lc_2" role="presentation"><a href="javascript:;" onclick="mostrar_tab_calostro(2)" style="font-size: 25px;padding: 10px;color:#555">'+lang.calostro+' 2</a></li>'+
            '</ul>'+
            '<div class="margins_small" id="dc_1" style="display:block;border-left: 1px solid #ddd;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;padding:10px">'+
                '<form action="" id="frm_cargar_calostro_1">'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.caravana+'</span>'+
                                '<input id="bec_caravana" name="bec_caravana" readonly type="text" class="form-control" placeholder="" value="'+bec_caravana+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.tipo+'</span>'+
                                '<div id="tipo_calostro" class="btn-toolbar" role="toolbar">'+
                                    '<div class="btn-group-justified" data-toggle="buttons">'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[1])&&calostro[1][1]==1?'active':'')+'">'+
                                            '<input name="cal_tipo_1" id="cal_tipo_1" type="radio" value="1" '+(calostro&&$.isArray(calostro[1])&&calostro[1][1]==1?'checked':'')+'>'+lang.tc_fresco+'</button>'+
                                        '</label>'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[1])&&calostro[1][1]==2?'active':'')+'">'+
                                            '<input name="cal_tipo_1" id="cal_tipo_1" type="radio" value="2" '+(calostro&&$.isArray(calostro[1])&&calostro[1][1]==2?'checked':'')+'>'+lang.tc_congelado+'</button>'+
                                        '</label>'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[1])&&calostro[1][1]==3?'active':'')+'">'+
                                            '<input name="cal_tipo_1" id="cal_tipo_1" type="radio" value="3" '+(calostro&&$.isArray(calostro[1])&&calostro[1][1]==3?'checked':'')+'>'+lang.tc_sustituto+'</button>'+
                                        '</label>'+                                            
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.metodo+'</span>'+
                                '<div id="metodo_calostro" class="btn-toolbar" role="toolbar">'+
                                    '<div class="btn-group-justified" data-toggle="buttons">'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[1])&&calostro[1][2]==1?'active':'')+'">'+
                                            '<input name="cal_metodo_1" id="cal_metodo_1" type="radio" value="1" '+(calostro&&$.isArray(calostro[1])&&calostro[1][2]==1?'checked':'')+'>'+lang.mc_tubo+'</button>'+
                                        '</label>'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[1])&&calostro[1][2]==2?'active':'')+'">'+
                                            '<input name="cal_metodo_1" id="cal_metodo_1" type="radio" value="2" '+(calostro&&$.isArray(calostro[1])&&calostro[1][2]==2?'checked':'')+'>'+lang.mc_botella+'</button>'+
                                        '</label>'+                                        
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+        
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.calidad+'</span>'+
                                '<input id="cal_calidad_1" name="cal_calidad_1" type="number" class="form-control" placeholder="" value="'+(calostro&&$.isArray(calostro[1])?calostro[1][3]:'')+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.cantidad+'</span>'+
                                '<input id="cal_cantidad_1" name="cal_cantidad_1" type="number" class="form-control" placeholder="" value="'+(calostro&&$.isArray(calostro[1])?calostro[1][4]:'')+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.vigor+'</span>'+
                                '<input id="cal_vigor_1" name="cal_vigor_1" type="number" class="form-control" placeholder="" value="'+(calostro&&$.isArray(calostro[1])?calostro[1][5]:'')+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.peso_al_nacer+'</span>'+
                                '<input id="cal_peso_1" name="cal_peso_1" type="number" class="form-control" placeholder="" value="'+(calostro&&$.isArray(calostro[1])?calostro[1][6]:'')+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.tecnico+'</span>'+
                                '<input id="cal_tecnico_1" name="cal_tecnico_1" type="text" class="form-control" placeholder="Nombre" value="'+(calostro&&$.isArray(calostro[1])?calostro[1][7]:localStorage.usu_nombre)+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<button type="button" onclick="cargar_calostro(1,'+bec_id+','+(calostro&&$.isArray(calostro[1])?calostro[1][0]:0)+')" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-ok"></span> '+(calostro&&$.isArray(calostro[1])?lang.actualizar:lang.listo)+'!</button>'+
                    '</div>'+
                '</form>'+
            '</div>'+
            '<div class="margins_small" id="dc_2" style="display:none;border-left: 1px solid #ddd;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;padding:10px">'+
                '<form action="" id="frm_cargar_calostro_2">'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.caravana+'</span>'+
                                '<input id="bec_caravana" name="bec_caravana" readonly type="text" class="form-control" placeholder="" value="'+bec_caravana+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.tipo+'</span>'+
                                '<div id="tipo_calostro" class="btn-toolbar" role="toolbar">'+
                                    '<div class="btn-group-justified" data-toggle="buttons">'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[2])&&calostro[2][1]==1?'active':'')+'">'+
                                            '<input name="cal_tipo_2" id="cal_tipo_2" type="radio" value="1" '+(calostro&&$.isArray(calostro[2])&&calostro[2][1]==1?'checked':'')+'>'+lang.tc_fresco+'</button>'+
                                        '</label>'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[2])&&calostro[2][1]==2?'active':'')+'">'+
                                            '<input name="cal_tipo_2" id="cal_tipo_2" type="radio" value="2" '+(calostro&&$.isArray(calostro[2])&&calostro[2][1]==2?'checked':'')+'>'+lang.tc_congelado+'</button>'+
                                        '</label>'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[2])&&calostro[2][1]==3?'active':'')+'">'+
                                            '<input name="cal_tipo_2" id="cal_tipo_2" type="radio" value="3" '+(calostro&&$.isArray(calostro[2])&&calostro[2][1]==3?'checked':'')+'>'+lang.tc_sustituto+'</button>'+
                                        '</label>'+                                            
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.metodo+'</span>'+
                                '<div id="metodo_calostro" class="btn-toolbar" role="toolbar">'+
                                    '<div class="btn-group-justified" data-toggle="buttons">'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[2])&&calostro[2][2]==1?'active':'')+'">'+
                                            '<input name="cal_metodo_2" id="cal_metodo_2" type="radio" value="1" '+(calostro&&$.isArray(calostro[2])&&calostro[2][2]==1?'checked':'')+'>'+lang.mc_tubo+'</button>'+
                                        '</label>'+
                                        '<label class="btn btn-default '+(calostro&&$.isArray(calostro[2])&&calostro[2][2]==2?'active':'')+'">'+
                                            '<input name="cal_metodo_2" id="cal_metodo_2" type="radio" value="2" '+(calostro&&$.isArray(calostro[2])&&calostro[2][2]==2?'checked':'')+'>'+lang.mc_botella+'</button>'+
                                        '</label>'+                                        
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+        
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.calidad+'</span>'+
                                '<input id="cal_calidad_1" name="cal_calidad_2" type="number" class="form-control" placeholder="" value="'+(calostro&&$.isArray(calostro[2])?calostro[2][3]:'')+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.cantidad+'</span>'+
                                '<input id="cal_cantidad_1" name="cal_cantidad_2" type="number" class="form-control" placeholder="" value="'+(calostro&&$.isArray(calostro[2])?calostro[2][4]:'')+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.vigor+'</span>'+
                                '<input id="cal_vigor_1" name="cal_vigor_2" type="number" class="form-control" placeholder="" value="'+(calostro&&$.isArray(calostro[2])?calostro[2][5]:'')+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.peso_al_nacer+'</span>'+
                                '<input id="cal_peso_1" name="cal_peso_2" type="number" class="form-control" placeholder="" value="'+(calostro&&$.isArray(calostro[2])?calostro[2][6]:'')+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.tecnico+'</span>'+
                                '<input id="cal_tecnico_1" name="cal_tecnico_2" type="text" class="form-control" placeholder="Nombre" value="'+(calostro&&$.isArray(calostro[2])?calostro[2][7]:localStorage.usu_nombre)+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<button type="button" onclick="cargar_calostro(2,'+bec_id+','+(calostro&&$.isArray(calostro[2])?calostro[2][0]:0)+')" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-ok"></span> '+(calostro&&$.isArray(calostro[2])?lang.actualizar:lang.listo)+'!</button>'+
                    '</div>'+
                '</form>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 7 */
function pantalla_7(){
    $('#cargando_app').show();
    var becerros='';
    db.transaction(function(tx){tx.executeSql('select a.par_vaca, b.bec_id, b.bec_fecha, b.bec_caravana, b.bec_condicion, count(c.cal_id) as cantidad from becerros b left join partos a ON (b.bec_parto=a.par_id) left join calostro c ON (b.bec_id=c.cal_becerro) WHERE a.par_rodeo="'+localStorage.usu_rodeo+'" and (b.bec_muerto<>"S" or b.bec_muerto is null) and (julianday(\'now\',\'localtime\')-julianday(Datetime(substr(b.bec_fecha,7,4)||"-"||substr(b.bec_fecha,4,2)||"-"||substr(b.bec_fecha,1,2)||" "||substr(b.bec_fecha,12,8))))<1 GROUP BY a.par_vaca, b.bec_id, b.bec_fecha, b.bec_caravana, b.bec_condicion ORDER BY Datetime(substr(b.bec_fecha,7,4)||"-"||substr(b.bec_fecha,4,2)||"-"||substr(b.bec_fecha,1,2)||" "||substr(b.bec_fecha,12,8))',[], function(tx, rs) {
        if(rs.rows.length) {
            for(i=0;i<rs.rows.length;i++){
                diff=datediff(rs.rows.item(i).bec_fecha,current_date(),'minutes');
                marcar='onclick="marcar_becerro('+rs.rows.item(i).bec_id+',\''+rs.rows.item(i).bec_caravana+'\',\''+rs.rows.item(i).bec_condicion+'\')"';
                var iconos_calostro='';
                for(j=0;j<rs.rows.item(i).cantidad;j++){
                    iconos_calostro=iconos_calostro+'<span class="glyphicon glyphicon-ok"></span>';
                }
                if(rs.rows.item(i).bec_condicion=='m') iconos_calostro='M';
                if(rs.rows.item(i).bec_condicion=='a') iconos_calostro='A';
                becerros=becerros+''+
                    '<tr '+marcar+' style="color:#000" id="reg_becerro_'+rs.rows.item(i).bec_id+'" name="reg_becerro_'+rs.rows.item(i).bec_id+'">'+
                        '<td valign="middle">'+rs.rows.item(i).par_vaca+'</td>'+
                        '<td valign="middle">'+rs.rows.item(i).bec_caravana+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(11,16)+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(3,5)+'/'+rs.rows.item(i).bec_fecha.substring(0,2)+'</td>'+
                        '<td valign="middle" align="right" width="80">'+iconos_calostro+'</td>'+
                    '</tr>';
            }
        }
        var html=''+
        '<div class="header row">'+
            '<div class="col-md-6">'+
            '<h4><strong>Calving App</strong></h4>'+
            '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;z-index:10">'+lang.sincronizar+'</button>'+                
            '</div>'+
            '<div class="col-md-6" style="text-align: right;"><h4>'+localStorage.usu_nombre+' ('+localStorage.usu_rodeo_desc+')</h4><a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span><strong> '+lang.volver+'</strong></a></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins_small">'+
                '<div class="panel panel-default">'+
                    '<div class="panel-heading">'+lang.becerros_activos+': '+rs.rows.length+'</div>'+
                        '<table id="tabla_fix" class="table table-condensed">'+
                            '<thead>'+
                              '<tr>'+
                                '<th>'+lang.id_vaca+'</th>'+
                                '<th>'+lang.becerro+'</th>'+
                                '<th>'+lang.hora+'</th>'+
                                '<th>'+lang.fecha+'</th>'+
                                '<th width="80"></th>'+
                              '</tr>'+
                            '</thead>'+
                            '<tbody>'+             
                                becerros+          
                            '</tbody>'+
                           '</table>'+       
                        '</div>'+
                        '<div class="functions_f">'+
                            '<div class="col-md-5" style="padding:5px">'+
                               '<button onclick="marcar_muerto()" type="button" class="ready btn btn-primary btn-lg">'+lang.muerto.toUpperCase()+'</span></button>'+
                               '<input type="hidden" name="bec_marcado" id="bec_marcado" value="">'+
                               '<input type="hidden" name="bec_nro_marcado" id="bec_nro_marcado" value="">'+
                               '<input type="hidden" name="bec_marcado_condicion" id="bec_marcado_condicion" value="">'+
                            '</div>'+
                            '<div class="col-md-5" style="padding:5px">'+
                              '<button onclick="marcar_calostro()" type="button" class="ready btn btn-primary btn-lg">'+lang.calostro.toUpperCase()+'</button>'+
                            '</div>'+
                            '<div class="col-md-2" style="padding:5px">'+
                               '<button type="button" onclick="editar_becerro()" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-pencil" style="border-bottom: white thin solid;"></span></button>'+
                            '</div>'+
                        '</div>'+                        
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#tabla_fix').fixheadertable({ 
        height : 400
    });
    $('#cargando_app').hide();
    })});
}

/* Pantalla 8 */
function pantalla_8(){
    $('#cargando_app').show();
    var partos='';
    var cantidad=0;
    db.transaction(function(tx){tx.executeSql('select a.par_fecha, a.par_id, a.par_vaca, par_fecha_fin, count(bec_id) as cantbec from partos a left join becerros b ON (a.par_id=b.bec_parto) WHERE a.par_rodeo="'+localStorage.usu_rodeo+'" AND par_fecha_fin<>"" group by a.par_fecha, a.par_id, a.par_vaca, par_fecha_fin ORDER BY Datetime(substr(par_fecha,7,4)||"-"||substr(par_fecha,4,2)||"-"||substr(par_fecha,1,2)||" "||substr(par_fecha,12,8))',[], function(tx, rs) {
        if(rs.rows.length) {
            for(i=0;i<rs.rows.length;i++){
                diff=datediff(rs.rows.item(i).par_fecha,current_date(),'hours');
                if(diff >= 24) continue;
                cantidad++;
                partos=partos+''+
                    '<tr>'+
                        '<td onclick="obtener_parto('+rs.rows.item(i).par_id+')"  width="50" height="35" style="background-color:green;"><span class="glyphicon glyphicon-pencil" style="border-bottom: black thin solid;"></span></td>'+
                        '<td onclick="'+(!rs.rows.item(i).par_fecha_fin?'pantalla_4('+rs.rows.item(i).par_id+',\''+rs.rows.item(i).par_vaca+'\')':'pantalla_5('+rs.rows.item(i).par_id+')')+'" valign="middle">'+rs.rows.item(i).par_vaca+'</td>'+
                        '<td onclick="'+(!rs.rows.item(i).par_fecha_fin?'pantalla_4('+rs.rows.item(i).par_id+',\''+rs.rows.item(i).par_vaca+'\')':'pantalla_5('+rs.rows.item(i).par_id+')')+'">'+rs.rows.item(i).par_fecha.substring(11,16)+'</td>'+
                        '<td onclick="'+(!rs.rows.item(i).par_fecha_fin?'pantalla_4('+rs.rows.item(i).par_id+',\''+rs.rows.item(i).par_vaca+'\')':'pantalla_5('+rs.rows.item(i).par_id+')')+'">'+rs.rows.item(i).par_fecha.substring(3,5)+'/'+rs.rows.item(i).par_fecha.substring(0,2)+'</td>'+
                    '</tr>';
            }
        }
        var html=''+
        '<div class="header row">'+
            '<div class="col-md-6">'+
            '<h4><span class="glyphicon glyphicon-time"></span> | '+lang.vacas_frescas+'</h4>'+
            '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;z-index:10">'+lang.sincronizar+'</button>'+                
            '</div>'+
            '<div class="col-md-6" style="text-align: right;"><h4>'+localStorage.usu_nombre+' ('+localStorage.usu_rodeo_desc+')</h4><a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span> '+lang.volver+'</a></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins_small">'+
                '<div class="panel panel-default">'+
                  '<div class="panel-heading">'+lang.vacas_frescas+': '+cantidad+'</div>'+
                  '<div id="tableContainer" class="tableContainer">'+
                  '<table id="tabla_fix" class="table table-condensed" >'+
                    '<thead>'+
                      '<tr>'+
                        '<th width="50"></th>'+
                        '<th>'+lang.id_vaca+'</th>'+
                        '<th>'+lang.hora+'</th>'+
                        '<th>'+lang.fecha+'</th>'+
                      '</tr>'+
                    '</thead>'+
                    '<tbody>'+
                        partos+          
                    '</tbody>'+
                   '</table>'+       
                   '</div>'+
                '</div>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#tabla_fix').fixheadertable({ 
        height : 400
    });
    $('#cargando_app').hide();
    })});
}

function comienza_parto(par_id){
    $('#cargando_app').show();    
    if(validar_formulario('frm_comienzo_parto','todos')){
        var values = new Array();
        values[0]=$('#par_vaca').val();
        values[1]=$('#par_lactancia').val();
        values[2]=$('#par_cc').val();
        values[3]=document.querySelector('input[name="par_vaca_raza"]:checked').value;
        values[4]=document.querySelector('input[name="par_higiene"]:checked').value
        values[5]=$('#par_tecnico').val();
        values[6]=current_date();
        values[7]=localStorage.usu_rodeo;
        values[8]=localStorage.usu_rodeo_desc;
        values[9]=$('#par_corral').val();
        values[10]=$('#par_observaciones').val();
        db.transaction(function(tx){tx.executeSql('select * from vacas WHERE vac_id=?', [values[0]], function(tx, rs) {
            if(!rs.rows.length) {
                db.transaction(function(tx){tx.executeSql("insert into vacas (vac_id,vac_raza) VALUES ('"+values[0]+"','"+values[3]+"')")});
                ultimo_movimiento("insert into vacas (vac_id,vac_raza) VALUES ('"+values[0]+"','"+values[3]+"')");
            }
            if(par_id>0){
                db.transaction(function(tx){tx.executeSql("update partos set par_vaca='"+values[0]+"', par_lactancia='"+values[1]+"', par_cc='"+values[2]+"', par_vaca_raza='"+values[3]+"', par_higiene='"+values[4]+"', par_tecnico='"+values[5]+"', par_corral='"+values[9]+"', par_observaciones='"+values[10]+"'  where par_id='"+par_id+"'",[],function(tx,rs){
                    ultimo_movimiento("update partos set par_vaca='"+values[0]+"', par_lactancia='"+values[1]+"', par_cc='"+values[2]+"', par_vaca_raza='"+values[3]+"', par_higiene='"+values[4]+"', par_tecnico='"+values[5]+"', par_corral='"+values[9]+"', par_observaciones='"+values[10]+"' where par_id='"+par_id+"'");
                    pantalla_2();
                })});
                }
            else{
                db.transaction(function(tx){tx.executeSql("insert into partos (par_vaca,par_lactancia,par_cc,par_vaca_raza,par_higiene,par_tecnico,par_fecha,par_rodeo,par_rodeo_desc,par_corral,par_observaciones) VALUES ('"+values.join("','")+"')")});
                ultimo_movimiento("insert into partos (par_vaca,par_lactancia,par_cc,par_vaca_raza,par_higiene,par_tecnico,par_fecha,par_rodeo,par_rodeo_desc,par_corral,par_observaciones) VALUES ('"+values.join("','")+"')");
                pantalla_2();
            }
        })});
    }
    $('#cargando_app').hide();
}

function fin_parto(par_id){
    $('#cargando_app').show();    
    if(validar_formulario('frm_fin_parto','todos')){
        var values = new Array();
        values[0]=document.querySelector('input[name="par_becerros"]:checked').value;
        values[1]=document.querySelector('input[name="par_dificultad"]:checked').value;
        values[2]=document.querySelector('input[name="par_raza_becerros"]:checked').value;
        values[3]=$('#par_tecnico_becerros').val();
        values[4]=current_date();
        db.transaction(function(tx){tx.executeSql("update partos set par_becerros='"+values[0]+"', par_dificultad='"+values[1]+"', par_raza_becerros='"+values[2]+"', par_tecnico_becerros='"+values[3]+"', par_fecha_fin='"+values[4]+"' where par_id='"+par_id+"'")});
        ultimo_movimiento("update partos set par_becerros='"+values[0]+"', par_dificultad='"+values[1]+"', par_raza_becerros='"+values[2]+"', par_tecnico_becerros='"+values[3]+"', par_fecha_fin='"+values[4]+"' where par_id='"+par_id+"'");
        pantalla_5(par_id);
    }
    $('#cargando_app').hide();
}

function cargar_becerro(par_id,bec_id){
    $('#cargando_app').show();
    if(validar_formulario('frm_cargar_becerro','todos')){
        var values = new Array();
        values[0]=par_id;
        values[1]=document.querySelector('input[name="bec_sexo"]:checked').value;
        values[2]=document.querySelector('input[name="bec_condicion"]:checked').value;
        values[3]=document.querySelector('input[name="bec_presentacion"]:checked').value;
        values[4]=$('#bec_caravana').val();
        values[5]=$('#bec_tecnico').val();
        values[6]=current_date();
        if(bec_id>0){
            db.transaction(function(tx){tx.executeSql("update becerros set bec_sexo='"+values[1]+"', bec_condicion='"+values[2]+"', bec_presentacion='"+values[3]+"', bec_caravana='"+values[4]+"', bec_tecnico='"+values[5]+"' where bec_id='"+bec_id+"'",[],function(tx,rs){
                ultimo_movimiento("update becerros set bec_sexo='"+values[1]+"', bec_condicion='"+values[2]+"', bec_presentacion='"+values[3]+"', bec_caravana='"+values[4]+"', bec_tecnico='"+values[5]+"' where bec_id='"+bec_id+"'");
                pantalla_7();            
            })});
        }
        else{
            db.transaction(function(tx){tx.executeSql("insert into becerros (bec_parto,bec_sexo,bec_condicion,bec_presentacion,bec_caravana,bec_tecnico,bec_fecha) VALUES ('"+values.join("','")+"')",[],function(tx,rs){
                ultimo_movimiento("insert into becerros (bec_parto,bec_sexo,bec_condicion,bec_presentacion,bec_caravana,bec_tecnico,bec_fecha) VALUES ('"+values.join("','")+"')");
                pantalla_5(par_id);
            })});
        }
        
    }
    $('#cargando_app').hide();
}

function mostrar_becerros(par_id,bec_id){
    $('#cargando_app').fadeIn(300)
    var becerros='';
    var display='none';
    var html='';
    db.transaction(function(tx){tx.executeSql('select  * from partos, becerros where par_id=bec_parto and par_id=?', [par_id], function(tx, rs) {
        if(rs.rows.length){
            for(i=0;i<rs.rows.length;i++){
                becerros=becerros+''+
                    '<tr onclick="obtener_becerro('+rs.rows.item(i).bec_id+')">'+
                        '<td height="35" valign="middle">'+rs.rows.item(i).bec_caravana+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(11,16)+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(0,5)+'</td>'+
                    '</tr>';
            }
            if(bec_id==0&&rs.rows.length==rs.rows.item(0).par_becerros){
                display='';
                $('#btn_agregar_becerro').hide();

                //muestro los becerros cargados una vez que termina de cargar todos
                var html=''+
                '<div class="col-md-12">'+
                    '<table id="activeb" class="table table-condensed">'+
                        '<thead>'+
                            '<tr>'+                             
                                '<th>'+lang.caravana+'</th>'+
                                '<th>'+lang.hora+'</th>'+
                                '<th>'+lang.fecha+'</th>'+
                            '</tr>'+
                        '</thead>'+
                        '<tbody>'+becerros+
                    '</table>'+
                    '<button onclick="pantalla_2()" type="submit" class="ready btn btn-primary btn-md" style="margin-top:2px;display:'+display+'"><span class="glyphicon glyphicon-ok" ></span>'+ lang.confirmar +'</button>'+
                '</div>';
                $('#frm_cargar_becerro').hide();
            }                        
        }        
        $('#tabla_becerros').html(html);
        $('#cargando_app').hide();
    })});
}

function buscar_vaca(id_vaca){
    if(id_vaca!=""){
        $('#cargando_app').show();
        db.transaction(function(tx){tx.executeSql('select * from vacas WHERE vac_id=?', [id_vaca], function(tx, rs) {
          if(rs.rows.length) {
            $('input:radio[name=par_vaca_raza][value='+rs.rows.item(0).vac_raza+']').click();
          }
          $('#cargando_app').hide();
        })});        
    }
}

function validar_formulario(form,campos){
    var vacio=false
    var $inputs = $('#'+form+' :input');
    $inputs.each(function() {
        if(this.type=='radio'&&!document.querySelector('input[name="'+this.name+'"]:checked')) vacio=true;
        if((this.type=='text'||this.type=='number')&&$(this).val()=='') vacio=true;
    });
    if(vacio){
      notificacion(lang.complete_todo_los_campos,"error");
      return false;
    } 
    else return true;
}

function current_date(){
    var today = new Date();
    var month = today.getMonth()+1<10?'0'+(today.getMonth()+1):(today.getMonth()+1);
    var day = today.getDate()<10?'0'+today.getDate():today.getDate();
    var year = today.getFullYear();
    var cHour = today.getHours()<10?'0'+today.getHours():today.getHours();
    var cMin = today.getMinutes()<10?'0'+today.getMinutes():today.getMinutes();
    var cSec = today.getSeconds()<10?'0'+today.getSeconds():today.getSeconds();
    return day+"/"+month+"/"+year+" "+cHour+ ":" + cMin+ ":" +cSec;    
}

function datediff(fromDate,toDate,interval) { 
    var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7; 
    fromDate = new Date(dateFormat(fromDate)); 
    toDate = new Date(dateFormat(toDate)); 
    var timediff = toDate - fromDate; 
    if (isNaN(timediff)) return NaN; 
    switch (interval) { 
        case "years": return toDate.getFullYear() - fromDate.getFullYear(); 
        case "months": return ( 
            ( toDate.getFullYear() * 12 + toDate.getMonth() ) 
            - 
            ( fromDate.getFullYear() * 12 + fromDate.getMonth() ) 
        ); 
        case "weeks"  : return Math.floor(timediff / week); 
        case "days"   : return Math.floor(timediff / day);  
        case "hours"  : return Math.floor(timediff / hour);  
        case "minutes": return Math.floor(timediff / minute); 
        case "seconds": return Math.floor(timediff / second); 
        default: return undefined; 
    } 
}

function dateFormat(fecha) {
    return fecha.substring(3,5)+'-'+fecha.substring(0,2)+'-'+fecha.substring(6,10)+' '+fecha.substring(11,19);
}

function ultimo_movimiento(sql){
    if(sql!=""){
        db.transaction(function(tx){tx.executeSql("insert into movimientos (mov_sql,usu_codigo) VALUES ('"+escape(sql)+"','"+localStorage.usu_codigo+"')")});
        db.transaction(function(tx){tx.executeSql("update configuracion set cfg_ult_act_local='"+current_date()+"'")});    
    }
}

function marcar_becerro(bec_id,bec_caravana,bec_condicion){
    if($('#reg_becerro_'+bec_id).hasClass('marca_becerro')){
        $('#reg_becerro_'+bec_id).removeClass();
        $('#bec_marcado').val('');
        $('#bec_nro_marcado').val('');
        $('#bec_marcado_condicion').val('');
    }
    else{
        $('tr[name*=reg_becerro_]').removeClass();
        $('#reg_becerro_'+bec_id).addClass('marca_becerro');
        $('#bec_marcado').val(bec_id);
        $('#bec_nro_marcado').val(bec_caravana);
        $('#bec_marcado_condicion').val(bec_condicion);
    }    
}

function marcar_muerto(){
    if($('#bec_marcado').val()!=""){
        db.transaction(function(tx){tx.executeSql("update becerros set bec_muerto='S', bec_fecha_muerto='"+current_date()+"' where bec_id='"+$('#bec_marcado').val()+"'")});       
        ultimo_movimiento("update becerros set bec_muerto='S', bec_fecha_muerto='"+current_date()+"' where bec_id='"+$('#bec_marcado').val()+"'");
        pantalla_7();
    }
}

function marcar_calostro(){
    if($('#bec_marcado').val()!=""&&$('#bec_nro_marcado').val()!=""){
        if($('#bec_marcado_condicion').val()=='a'||$('#bec_marcado_condicion').val()=='m') return false;
        db.transaction(function(tx){tx.executeSql('select  * from calostro where cal_becerro=?', [$('#bec_marcado').val()], function(tx, rs) {
            calostro=Array();
            if(rs.rows.length){
                for(i=0;i<rs.rows.length;i++){
                    if(!rs.rows.item(i).cal_nro) rs.rows.item(i).cal_nro=1;
                    calostro[rs.rows.item(i).cal_nro]=Array();
                    calostro[rs.rows.item(i).cal_nro][0]=rs.rows.item(i).cal_id;
                    calostro[rs.rows.item(i).cal_nro][1]=rs.rows.item(i).cal_tipo;
                    calostro[rs.rows.item(i).cal_nro][2]=rs.rows.item(i).cal_metodo;
                    calostro[rs.rows.item(i).cal_nro][3]=rs.rows.item(i).cal_calidad;
                    calostro[rs.rows.item(i).cal_nro][4]=rs.rows.item(i).cal_cantidad;
                    calostro[rs.rows.item(i).cal_nro][5]=rs.rows.item(i).cal_vigor;
                    calostro[rs.rows.item(i).cal_nro][6]=rs.rows.item(i).cal_peso;
                    calostro[rs.rows.item(i).cal_nro][7]=rs.rows.item(i).cal_tecnico;
                }
                pantalla_6($('#bec_marcado').val(),$('#bec_nro_marcado').val(),calostro);
            }
            else{
                pantalla_6($('#bec_marcado').val(),$('#bec_nro_marcado').val());
            }
        })});
    }
}

function editar_becerro(){
    if($('#bec_marcado').val()!=""){        
        obtener_becerro($('#bec_marcado').val());
    }
}

function cargar_calostro(cal_nro,bec_id,cal_id){
    $('#cargando_app').show();
    if(validar_formulario('frm_cargar_calostro_'+cal_nro,'todos')){
        var values = new Array();
        values[0]=bec_id;
        values[1]=$('#cal_calidad_'+cal_nro).val();
        values[2]=$('#cal_cantidad_'+cal_nro).val();
        values[3]=$('#cal_vigor_'+cal_nro).val();
        values[4]=$('#cal_peso_'+cal_nro).val();
        values[5]=$('#cal_tecnico_'+cal_nro).val();
        values[6]=current_date();
        values[7]=document.querySelector('input[name="cal_tipo_'+cal_nro+'"]:checked').value;
        values[8]=document.querySelector('input[name="cal_metodo_'+cal_nro+'"]:checked').value;
        values[9]=cal_nro;        
        if(cal_id>0){
            db.transaction(function(tx){tx.executeSql("update calostro set cal_calidad='"+values[1]+"',cal_cantidad='"+values[2]+"',cal_vigor='"+values[3]+"',cal_peso='"+values[4]+"',cal_tecnico='"+values[5]+"',cal_tipo='"+values[7]+"',cal_metodo='"+values[8]+"' WHERE cal_id='"+cal_id+"'",[],function(tx,rs){
                ultimo_movimiento("update calostro set cal_calidad='"+values[1]+"',cal_cantidad='"+values[2]+"',cal_vigor='"+values[3]+"',cal_peso='"+values[4]+"',cal_tecnico='"+values[5]+"',cal_tipo='"+values[7]+"',cal_metodo='"+values[8]+"' WHERE cal_id='"+cal_id+"'");
                pantalla_7();
            })});    
        }
        else{
            db.transaction(function(tx){tx.executeSql("insert into calostro (cal_becerro,cal_calidad,cal_cantidad,cal_vigor,cal_peso,cal_tecnico,cal_fecha,cal_tipo,cal_metodo,cal_nro) VALUES ('"+values.join("','")+"')",[],function(tx,rs){
                ultimo_movimiento("insert into calostro (cal_becerro,cal_calidad,cal_cantidad,cal_vigor,cal_peso,cal_tecnico,cal_fecha,cal_tipo,cal_metodo,cal_nro) VALUES ('"+values.join("','")+"')");
                pantalla_7();
            })});    
        }
    }
    $('#cargando_app').hide();
}

function obtener_becerro(bec_id){
    db.transaction(function(tx){tx.executeSql('select  * from becerros where bec_id=?', [bec_id], function(tx, rs) {
        if(rs.rows.length){
            becerro=Array();
            becerro[0]=rs.rows.item(0).bec_parto;
            becerro[1]=rs.rows.item(0).bec_sexo;
            becerro[2]=rs.rows.item(0).bec_condicion;
            becerro[3]=rs.rows.item(0).bec_presentacion;
            becerro[4]=rs.rows.item(0).bec_caravana;
            becerro[5]=rs.rows.item(0).bec_tecnico;
            becerro[6]=rs.rows.item(0).bec_id;
            pantalla_5(rs.rows.item(0).bec_parto,becerro);
        }
        else{
            return false;
        }
    })});
}

function obtener_parto(par_id){
    db.transaction(function(tx){tx.executeSql('select  * from partos where par_id=?', [par_id], function(tx, rs) {
        if(rs.rows.length){
            parto=Array();
            parto[0]=rs.rows.item(0).par_vaca;
            parto[1]=rs.rows.item(0).par_lactancia;
            parto[2]=rs.rows.item(0).par_cc;
            parto[3]=rs.rows.item(0).par_vaca_raza;
            parto[4]=rs.rows.item(0).par_higiene;
            parto[5]=rs.rows.item(0).par_tecnico;
            parto[6]=rs.rows.item(0).par_id;
            parto[7]=rs.rows.item(0).par_corral;
            parto[8]=rs.rows.item(0).par_observaciones;
            pantalla_3(parto);
        }
        else{
            return false;
        }
    })});
}

/* Verifico si necesita actualizar la aplicacion */

function buscar_actualizaciones(){
  if(navigator.onLine){
    db.transaction(function(tx){tx.executeSql('select * from configuracion', [], function(tx, rs) {
      $.post(dir_datos+'datos.php',{accion:'ultima_actualizacion',fecha:rs.rows.item(0).cfg_ult_sinc},function(res){
        if(res!="NO"){
          actualizar();
        }
        else if(datediff(rs.rows.item(0).cfg_ult_sinc,rs.rows.item(0).cfg_ult_act_local,'minutes')>60){
            actualizar();
        }
        else{
          setTimeout(function(){buscar_actualizaciones();},600000);
        }
      });
    })});
  }
}

function actualizar(){
    html=''+
        '<span style="font-size:20px;">'+lang.msg_sincronizar+'</span>&nbsp;&nbsp;'+
        '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-sm">'+lang.sincronizar+'</button>&nbsp;&nbsp;'+
        '<button type="button" onclick="actualizar_cancelar()" class="btn btn-danger btn-sm">'+lang.cancelar+'</button>';
    $('#actualizar').html(html);
    $('#actualizar').css('bottom','-100px');
    $('#actualizar').show();
    $('#actualizar').animate({ bottom: '0' }, 500);    
}

function actualizar_aceptar(){
    location.replace('sinc.html?kk='+Math.random());
}

function actualizar_cancelar(){
    $('#actualizar').animate({ bottom: '-100' }, 500);
}

function soloNumeros(e){
    var key = window.Event ? e.which : e.keyCode
    return (key >= 48 && key <= 57 || key == 46)
}

function cambiar_idioma(idioma){
    if(idioma=='es') lang=lang_es;
    if(idioma=='en') lang=lang_en; 
    verificar_base();
}

function mostrar_tab_calostro(cal){
    $("#lc_1").removeClass("active");
    $("#lc_2").removeClass("active");
    $("#dc_1").hide();
    $("#dc_2").hide();
    $("#lc_"+cal).addClass("active");
    $("#dc_"+cal).show();
}

buscar_actualizaciones();

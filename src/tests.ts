import { createClient } from "./index";

async function wow(){
 const client = createClient()


 client.on('ALERT',(data)=>{

  console.log('alert',data)

 }
 )


  client.on('SYSTEM_MESSAGE',(data)=>{

  //console.log('SYSTEM_MESSAGE',data)

 }
 )

 client.on('connected',()=>console.log('connected'))

}


wow()
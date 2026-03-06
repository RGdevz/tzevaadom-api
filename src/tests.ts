import { createPollingClient, createWebSocketClient } from "./index";

async function wow(){

    const client = createPollingClient()

    client.on('connected',()=>{
        console.log('connected')
    })

    client.start()

//     console.log('starting')
//  const client = createWebSocketClient()


//  client.on('ALERT',(data)=>{

//   console.log('alert',data)

//  }
//  )


//   client.on('SYSTEM_MESSAGE',(data)=>{

//   //console.log('SYSTEM_MESSAGE',data)

//  }
//  )

//  client.on('connected',()=>console.log('connected'))

}


wow()
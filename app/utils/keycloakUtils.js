import axios from 'axios'
export const  getUserGroup = async (sub,authHeader )=>{

    return new Promise(async (resolve,reject)=>{
        try {
            const groups = await axios.get(
                `${process.env.KEYCLOAK_AUTH_URL}admin/realms/washroom/users/${sub}/groups`,
                {
                  headers: {
                    authorization: authHeader,
                  },
                }
              );
        
               resolve(groups?.data)
            
         } catch (error) {
            reject(error)
            
    }


    
     }
    )
}


